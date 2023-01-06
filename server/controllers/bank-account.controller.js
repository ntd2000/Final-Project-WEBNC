import BankAccount from '../models/bank-account.model.js';
import { verifySignature } from '../utils/rsa.util.js';
import { TransferFee } from '../models/transfer-fee.model.js';
import TransferMethod from '../models/transfer-method.model.js';
import BankType from '../models/bank-type.model.js';
import fetch from 'node-fetch';
import Identity from '../models/identity.model.js';

export default {
    async getAll(req, res) {
        const joinWithIdentity = {
            $lookup: {
                from: 'identities',
                localField: 'identityId',
                foreignField: '_id',
                as: 'identities',
            },
        };

        const pipelines = [joinWithIdentity];

        const records = await BankAccount.aggregate(pipelines);
        const bankAccounts = Array.from(records.values());

        const responses = bankAccounts.map((b) => {
            return {
                _id: b._id,
                accountNumber: b.accountNumber,
                overBalance: b.overBalance,
                identity: {
                    aliasName: b.identities[0].aliasName,
                },
            };
        });

        return res.status(200).json(responses);
    },

    async getAllByUserId(req, res) {
        const { isPayment } = req.query;

        const where = { identityId: req.userId };

        if (isPayment !== null && isPayment !== undefined) {
            where['isPayment'] = isPayment;
        }

        const records = await BankAccount.find(where);

        res.status(200).json(records);
    },

    async getById(req, res) {
        const { id } = req.params;
        const record = await BankAccount.findById(id);

        res.status(200).json(record);
    },

    async getByAccountNumberAndBankType(req, res) {
        const { accountNumber, bankTypeId } = req.query;

        const internalBankType = await BankType.findOne({ name: 'My Bank' });
        const isInternalBank = internalBankType._id.toString() === bankTypeId;

        console.log('isInternalBank', isInternalBank);

        if (isInternalBank) {
            const bankAccount = await BankAccount.findOne({ accountNumber });
            console.log('bankAccount ne', bankAccount);
            if (!bankAccount) {
                return res
                    .status(404)
                    .json({ message: 'Không tìm thấy tài khoản ngân hàng' });
            }

            const identity = await Identity.findById(bankAccount.identityId);
            const response = {
                id: bankAccount._id,
                accountNumber: bankAccount.accountNumber,
                user: {
                    id: identity._id,
                    email: identity.email,
                    fullname: identity.aliasName,
                    phone: identity.phoneNumber,
                },
            };

            return res.status(200).json(response);
        } else {
            const payload = {
                path: '/partnerBank/queryAccount',
            };
            const response = await fetch(
                process.env.PARTNER_BANK_GENERATE_TOKEN_URL_PATH,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(payload),
                }
            );

            const { timestamp, encrypt } = await response.json();

            // Get
            const url = `${process.env.PARTNER_BANK_QUERY_ACCOUNT_URL_PATH}?timestamp=${timestamp}`;
            const request = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${encrypt}`,
                },
            });

            const dataResponse = await request.json();
            const { accountNumber: externalBankAccountNumber } = dataResponse;

            if (externalBankAccountNumber !== accountNumber) {
                return res
                    .status(404)
                    .json({ message: 'Không tìm thấy tài khoản ngân hàng' });
            }

            return res.status(200).json(dataResponse);
        }
    },

    async create(req, res) {
        const { identityId } = req.body;

        const defaultBank = await BankType.findOne({ name: 'My Bank' });
        const defaultBankAccount = {
            accountNumber: Math.floor(Math.random() * 1000000),
            overBalance: 0,
            isPayment: false,
            identityId: identityId,
            bankTypeId: defaultBank._id,
        };

        const insertedData = await BankAccount.create(defaultBankAccount);
        if (!insertedData) {
            return res.status(500).json({ message: 'Đã có lỗi xảy ra' });
        }

        res.status(200).json(defaultBankAccount);
    },

    async update(req, res) {
        const { id } = req.params;
        const { isPayment, isLocked, deposit } = req.body;

        const session = await BankAccount.startSession();
        session.startTransaction();
        try {
            const bankAccount = await BankAccount.findById(id);
            if (!bankAccount) {
                return res.status(404).json('Cannot find this Bank Account');
            }

            if (isPayment) {
                const records = await BankAccount.find({
                    identityId: req.userId,
                });

                const processedRecords = records.map((r) => {
                    if (r._id.toString() === id) {
                        r.isPayment = true;
                        return r;
                    }

                    r.isPayment = false;
                    return r;
                });

                const bulk = BankAccount.collection.initializeOrderedBulkOp();

                if (processedRecords.length > 0) {
                    processedRecords.forEach((r) =>
                        bulk
                            .find({
                                _id: r._id,
                            })
                            .updateOne({ $set: r })
                    );
                    await bulk.execute();
                    await session.commitTransaction();
                }

                return res.status(200).json('Update Bank Account Successfully');
            }

            if (isLocked) {
                const updatedBankAccount = await BankAccount.updateOne(
                    {
                        _id: id,
                    },
                    {
                        isLocked,
                    }
                );
                if (!updatedBankAccount) {
                    return res
                        .status(500)
                        .json('Đã có lỗi xảy ra, vui lòng thử lại sau!!!');
                }

                return res.status(200).json('Cập nhật thành công!!!');
            }

            const where = {};

            if (deposit) {
                if (deposit < 0) {
                    return res.status(401).json('Không được nhập số âm');
                }
                where['overBalance'] = bankAccount.overBalance + deposit;
            }

            const updatedBankAccount = await BankAccount.updateOne(
                {
                    _id: id,
                },
                where
            );
            if (!updatedBankAccount) {
                res.status(500).json(
                    'Đã có lỗi xảy ra, vui lòng thử lại sau!!!'
                );
            }

            return res.status(200).json('Cập nhật thành công!!!');
        } catch (error) {
            await session.abortTransaction();
            return res
                .status(500)
                .json('Đã có lỗi xảy ra, vui lòng thử lại sau!!!');
        }
    },

    // API for another bank to connect
    async rechargeMoney(req, res) {
        const { id: receiverBankAccountId } = req.params;
        const {
            bankAccountId: senderBankAccountId,
            deposit,
            signature,
            transferMethod,
            transferTime,
        } = req.body;

        const isNotValidSignature = verifySignature(signature);
        if (isNotValidSignature) {
            return res.status(403).json('Chữ ký không hợp lệ');
        }

        const receiverBankAccount = await BankAccount.findById(
            receiverBankAccountId
        );
        if (!receiverBankAccount) {
            return res
                .status(404)
                .json('Không tìm thấy tài khoản ngân hàng này');
        }

        const totalAmount =
            transferMethod === 'Receiver pay'
                ? deposit - TransferFee.External
                : deposit;

        const updatedBankAccount = await BankAccount.updateOne(
            {
                _id: id,
            },
            {
                overBalance: receiverBankAccount.overBalance + totalAmount,
            }
        );
        if (!updatedBankAccount) {
            return res.status(500).json('Something error');
        }

        // Save it billing.
        const correspondTransferMethod =
            transferMethod === 'Receiver pay'
                ? await TransferMethod.findOne('Receiver Pay Transfer Fee')
                : await TransferMethod.findOne('Sender Pay Transfer Fee');

        const document = {
            senderId: senderBankAccountId,
            receiverId: receiverBankAccountId,
            deposit,
            description,
            transferType: TransferType.MoneyTransfer,
            transferMethodId: correspondTransferMethod._id,
            transferFee: TransferFee.External,
            transferTime,
            signature,
        };

        insertedData = await Billing.create(document);
        if (!insertedData) {
            return res.status(500).json('Something error');
        }

        return res.status(200).json('Recharge successfully');
    },
};
