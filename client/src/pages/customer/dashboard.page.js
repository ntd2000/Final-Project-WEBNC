import Title from 'antd/es/typography/Title.js';
import styled from '@xstyled/styled-components';
import {
    Button,
    Checkbox,
    message,
    Modal,
    Input,
    Skeleton,
    Table,
    Space,
} from 'antd';
import { ServiceList } from '../../components/dashboard/service-list.component.js';
import { ReloadOutlined, SwapOutlined } from '@ant-design/icons';
import { useEffect, useState, useCallback, useMemo } from 'react';
import { BankAccountList } from '../../components/dashboard/bank-account-list.component.js';
import { MoneyTransferForm } from '../../components/money-transfer/money-transfer-form.component.js';
import { Form } from 'antd';
import OTPInput from '../../components/common/otp-input/index.js';
import { useStore, actions } from '../../store';
import ContentLayout from '../../components/common/content-layout.component.js';

const GeneralInformationSection = styled.div`
    display: flex;
    justify-content: space-between;
`;

const ServiceSection = styled.div`
    margin: 30px 0px;
`;

const HistorySection = styled.div``;

export const CustomerDashBoardPage = () => {
    const [state, dispatch] = useStore();
    const [paymentAccountHistory, setPaymentAccountHistory] = useState(null);
    const { profile, paymentAccountNumber, bankTypes, transferMethods } = state;
    const [receivers, setReceivers] = useState(null);
    const [moneyTransferForm] = Form.useForm();
    const [paymentAccountInfo, setPaymentAccount] = useState(null);
    const [bankAccounts, setBankAccountList] = useState([]);
    const [changeAccountModalVisibility, setChangeAccountModalVisibility] =
        useState(false);
    const [confirmOtpModalVisibility, setConfirmOtpModalVisibility] =
        useState(false);
    const [moneyTransferModalVisibility, setMoneyTransferModalVisibility] =
        useState(false);
    const [addReceiverModalVisibility, setAddReceiverModalVisibility] =
        useState(false);
    const [otp, setOtp] = useState('');
    const [isReloadGeneralInformation, setReloadStatus] = useState(false);
    const [isConfirmTransferLoading, setConfirmTransferLoading] =
        useState(false);
    const [isConfirmOtpLoading, setConfirmOtpLoading] = useState(false);

    const [addReceiverForm] = Form.useForm();

    const handleConfirmAddReceiver = () => {
        const { aliasName, receiverAccountNumber } =
            addReceiverForm.getFieldsValue();

        if (receivers.accountNumber === receiverAccountNumber) {
            message.error('???? t???n t???i ng?????i nh???n n??y r???i');
            return;
        }

        const payload = {
            senderAccountNumber: localStorage.getItem('payment-account-number'),
            receiverAccountNumber,
            aliasName,
        };

        fetch(process.env.REACT_APP_RECEIVER_API_URL_PATH, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: localStorage.getItem('accessToken'),
            },
            body: JSON.stringify(payload),
        })
            .then(() => {
                message.success('Th??m ng?????i nh???n th??nh c??ng');
                addReceiverForm.resetFields();
                getReceivers();
            })
            .catch(() => {
                message.error('Th??m ng?????i nh???n th???t b???i');
            });
    };

    const toggleConfirmOtpModalVisibility = () => {
        setConfirmOtpModalVisibility(!confirmOtpModalVisibility);
    };

    const toggleAddReceiverModalVisibility = () => {
        setAddReceiverModalVisibility(!addReceiverModalVisibility);
    };

    useEffect(() => {
        getPaymentBankAccount();
    }, [bankAccounts]);

    useEffect(() => {
        const getBankTypes = async () => {
            fetch(process.env.REACT_APP_BANK_TYPE_API_URL_PATH, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: localStorage.getItem('accessToken'),
                },
            })
                .then((response) => response.json())
                .then((data) => {
                    localStorage.setItem('bank-types', JSON.stringify(data));
                    dispatch(actions.setBankTypes(data));
                });
        };

        const getTransferMethods = async () => {
            fetch(process.env.REACT_APP_TRANSFER_METHOD_API_URL_PATH, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: localStorage.getItem('accessToken'),
                },
            })
                .then((response) => response.json())
                .then((data) => {
                    localStorage.setItem(
                        'transfer-methods',
                        JSON.stringify(data)
                    );
                    dispatch(actions.setTransferMethods(data));
                });
        };

        getBankTypes();
        getTransferMethods();
    }, []);

    useEffect(() => {
        getReceivers();
        getPaymentBankAccountHistory();
    }, [paymentAccountInfo]);

    const getPaymentBankAccount = useCallback(() => {
        const apiUrl = `${process.env.REACT_APP_BANK_ACCOUNT_API_URL_PATH}?isPayment=true`;

        fetch(apiUrl, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                Authorization: localStorage.getItem('accessToken'),
            },
        })
            .then((response) => response.json())
            .then((data) => {
                setPaymentAccount(data[0]);
                localStorage.setItem(
                    'payment-account-number',
                    data[0].accountNumber
                );
                dispatch(
                    actions.setPaymentAccountNumber(
                        localStorage.getItem('payment-account-number')
                    )
                );
            });
    }, []);

    const getReceivers = useCallback(() => {
        const url = `${process.env.REACT_APP_RECEIVER_API_URL_PATH}?accountNumber=${paymentAccountNumber}`;

        fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                Authorization: localStorage.getItem('accessToken'),
            },
        })
            .then((response) => response.json())
            .then((data) => setReceivers(data));
    }, []);

    const getPaymentBankAccountHistory = useCallback(() => {
        const paymentAccountNumber = localStorage.getItem(
            'payment-account-number'
        );
        if (paymentAccountNumber) {
            const url = `${process.env.REACT_APP_BILLING_API_URL_PATH}/payment-account-history?accountNumber=${paymentAccountNumber}`;
            fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: localStorage.getItem('accessToken'),
                },
            })
                .then((response) => response.json())
                .then((data) => setPaymentAccountHistory(data));
        }
    }, []);

    const handleDeleteReceiverClick = (receiverId) => {
        Modal.confirm({
            title: 'B???n c?? ch???c mu???n xo?? ng?????i nh???n n??y kh??ng?',
            okText: 'C??',
            cancelText: 'Kh??ng',
            onOk: () => {
                const url = `${process.env.REACT_APP_RECEIVER_API_URL_PATH}/${receiverId}`;
                fetch(url, {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: localStorage.getItem('accessToken'),
                    },
                })
                    .then(() => {
                        message.success('Xo?? th??nh c??ng');
                        getReceivers();
                    })
                    .catch((err) => {
                        message.error('???? c?? l???i x???y ra. Vui l??ng th??? l???i');
                    });
            },
        });
    };

    const handleSelectPaymentAccountClick = (bankAccount) => {
        const url = `${process.env.REACT_APP_BANK_ACCOUNT_API_URL_PATH}/${bankAccount._id}`;
        const data = {
            isPayment: true,
        };

        fetch(url, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                Authorization: localStorage.getItem('accessToken'),
            },
            body: JSON.stringify(data),
        })
            .then((response) => {
                localStorage.setItem(
                    'payment-account-number',
                    bankAccount.accountNumber
                );
                dispatch(
                    actions.setPaymentAccountNumber(
                        localStorage.getItem('payment-account-number')
                    )
                );
                message.success('Thay ?????i t??i kho???n th??nh c??ng');
                setPaymentAccount(bankAccount);
                getReceivers();
            })
            .catch((error) => message.error(error));
    };

    const toggleChangeAccountModalVisible = () =>
        setChangeAccountModalVisibility(!changeAccountModalVisibility);

    const toggleMoneyTransferModalVisible = () =>
        setMoneyTransferModalVisibility(!moneyTransferModalVisibility);

    const services = [
        {
            icon: <SwapOutlined />,
            name: 'Chuy???n ti???n',
            onClick: toggleMoneyTransferModalVisible,
        },
    ];

    const historyColumns = useMemo(
        () => [
            {
                title: 'S??? t??i kho???n g???i',
                dataIndex: 'senderAccountNumber',
                key: 'senderAccountNumber',
            },
            {
                title: 'S??? t??i kho???n nh???n',
                dataIndex: 'receiverAccountNumber',
                key: 'receiverAccountNumber',
            },
            {
                title: 'S??? ti???n(VN??)',
                dataIndex: 'transferMoney',
                key: 'transferMoney',
            },
            {
                title: 'N???i dung',
                dataIndex: 'description',
                key: 'description',
            },
            {
                title: 'Ng??y giao d???ch',
                dataIndex: 'transferTime',
                key: 'transferTime',
                render: (transferTime) =>
                    new Date(parseInt(transferTime)).toLocaleString(),
            },
        ],
        []
    );

    const renderPaymentAccountHistoryTable = () => {
        if (!paymentAccountHistory) {
            return <Skeleton />;
        } else {
            // Nhan tien
            const receiveBillings = paymentAccountHistory.filter(
                (p) => p.type === 'receive'
            );
            
            const mappedReceiveBillingDataSource = receiveBillings.map(
                (r, index) => {
                    return {
                        key: index,
                        senderAccountNumber: r.sender.accountNumber,
                        receiverAccountNumber: 'T??i',
                        transferMoney: r.deposit,
                        description: r.description,
                        transferTime: r.transferTime,
                    };
                }
            );

            // Chuyen tien
            const transferBillings = paymentAccountHistory.filter(
                (p) => p.type === 'transfer'
            );
            const mappedTransferBillingDataSource = transferBillings.map(
                (t, index) => {
                    return {
                        key: index,
                        senderAccountNumber: 'T??i',
                        receiverAccountNumber: t.receiver.accountNumber,
                        transferMoney: t.deposit,
                        description: t.description,
                        transferTime: t.transferTime,
                    };
                }
            );
            // Nhac no
            const debitBillings = paymentAccountHistory.filter(
                (p) => p.type === 'debit'
            );
            console.log(debitBillings)
            const mappedDebitBillingDataSource = debitBillings.map(
                (d, index) => {
                    return {
                        key: index,
                        senderAccountNumber: d.sender.accountNumber,
                        receiverAccountNumber: d.receiver.accountNumber,
                        transferMoney: d.deposit,
                        description: d.description,
                        transferTime: d.transferTime,
                    };
                }
            );

            return (
                <>
                    <p>
                        <strong>
                            <i>Giao d???ch nh???n ti???n</i>
                        </strong>
                    </p>
                    <Table
                        columns={historyColumns}
                        dataSource={mappedReceiveBillingDataSource}
                    />
                    <p>
                        <strong>
                            <i>Giao d???ch chuy???n ti???n</i>
                        </strong>
                    </p>
                    <Table
                        columns={historyColumns}
                        dataSource={mappedTransferBillingDataSource}
                    />
                    <p>
                        <strong>
                            <i>Giao d???ch thanh to??n nh???c n???</i>
                        </strong>
                    </p>
                    <Table
                        columns={historyColumns}
                        dataSource={mappedDebitBillingDataSource}
                    />
                </>
            );
        }
    };

    const getBankAccounts = useCallback(() => {
        fetch(process.env.REACT_APP_BANK_ACCOUNT_API_URL_PATH, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                Authorization: localStorage.getItem('accessToken'),
            },
        })
            .then((response) => response.json())
            .then((data) => {
                setBankAccountList(data);
            });
    }, []);

    const handleChangeAccountClick = () => {
        getBankAccounts();
        toggleChangeAccountModalVisible();

        getPaymentBankAccount();
    };

    const reloadGeneralInformation = () => {
        setReloadStatus(true);
        setPaymentAccount(null);

        getPaymentBankAccount();
        setReloadStatus(false);
    };

    const renderGeneralInformation = () =>
        paymentAccountInfo === null ? (
            <Skeleton />
        ) : (
            <>
                <div>
                    <Space size='middle'>
                        <Title level={2}>
                            <span>Th??ng tin chung</span>
                        </Title>
                        <Button
                            icon={<ReloadOutlined />}
                            loading={isReloadGeneralInformation}
                            onClick={reloadGeneralInformation}
                        />
                    </Space>
                    <p>S??? t??i kho???n: {paymentAccountInfo.accountNumber}</p>
                    <p>Ch??? t??i kho???n: {profile.aliasName}</p>
                    <p>S??? d??: {paymentAccountInfo.overBalance} (VN??)</p>
                </div>
                <Button type='primary' onClick={handleChangeAccountClick}>
                    Thay ?????i t??i kho???n
                </Button>
            </>
        );

    const handleConfirmTransfer = () => {
        const {
            receiverAccountNumber,
            bankTypeId,
            deposit,
            transferMethodId,
            description,
        } = moneyTransferForm.getFieldsValue();

        setConfirmTransferLoading(true);

        if (!receiverAccountNumber) {
            message.error('Vui l??ng nh???p s??? t??i kho???n ng?????i nh???n');
            setConfirmTransferLoading(false);

            return;
        }

        if (!bankTypeId) {
            message.error('Vui l??ng ch???n lo???i ng??n h??ng');
            setConfirmTransferLoading(false);

            return;
        }

        if (!deposit) {
            message.error('Vui l??ng nh???p s??? ti???n');
            setConfirmTransferLoading(false);

            return;
        }

        if (!transferMethodId) {
            message.error('Vui l??ng ch???n ph????ng th???c thanh to??n');
            setConfirmTransferLoading(false);

            return;
        }

        // validate.
        const payload = {
            senderAccountNumber: localStorage.getItem('payment-account-number'),
            receiverAccountNumber,
            bankTypeId,
            deposit,
            transferMethodId,
            description: description ?? '',
            transferTime: Date.now(),
        };

        fetch(process.env.REACT_APP_BILLING_API_URL_PATH, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: localStorage.getItem('accessToken'),
            },
            body: JSON.stringify(payload),
        })
            .then((response) => response.json())
            .then((data) => {
                if (data.message) {
                    message.error(data.message);
                    return;
                }

                message.success('Th??nh c??ng!!!');

                const isNotSavedReceiverBefore = receivers.every((value) => {
                    return value.accountNumber !== receiverAccountNumber;
                });

                localStorage.setItem(
                    'is-not-saved-receiver-before',
                    isNotSavedReceiverBefore
                );
                localStorage.setItem(
                    'current-receiver-account-number',
                    receiverAccountNumber
                );

                toggleConfirmOtpModalVisibility();
                localStorage.setItem('billing-id', data._id);
                localStorage.setItem(
                    'is-external-transaction',
                    data.isExternalTransaction
                );
                setConfirmTransferLoading(false);
            })
            .catch((error) => {
                message.error(error);
                setConfirmTransferLoading(false);
            });
    };

    const handleConfirmOtp = () => {
        const url = `${
            process.env.REACT_APP_BILLING_API_URL_PATH
        }/${localStorage.getItem('billing-id')}/verify-otp`;
        const payload = {
            otp,
        };

        fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: localStorage.getItem('accessToken'),
            },
            body: JSON.stringify(payload),
        })
            .then((response) => response.json())
            .then((value) => {
                if (value.message) {
                    message.error(value.message);
                    return;
                }

                message.success('Giao d???ch th??nh c??ng');
                toggleConfirmOtpModalVisibility();
                getPaymentBankAccountHistory();

                // Show Success Modal.
                const isNotSavedReceiverBefore = JSON.parse(
                    localStorage.getItem('is-not-saved-receiver-before')
                );
                console.log(
                    'isNotSavedReceiverBefore',
                    isNotSavedReceiverBefore
                );

                Modal.success({
                    title: 'Th??nh c??ng',
                    content: (
                        <>
                            {isNotSavedReceiverBefore && (
                                <Checkbox
                                    id='saveReceiverCheckBox'
                                    defaultChecked={false}>
                                    L??u ngu???i nh???n
                                </Checkbox>
                            )}
                        </>
                    ),
                    onOk: () => {
                        if (isNotSavedReceiverBefore) {
                            let savedReceiverCheckbox = document.querySelector(
                                '#saveReceiverCheckBox'
                            );
                            var isSaveReceiverChecked =
                                savedReceiverCheckbox.checked === true;

                            if (isSaveReceiverChecked) {
                                const payload = {
                                    senderAccountNumber: localStorage.getItem(
                                        'payment-account-number'
                                    ),
                                    receiverAccountNumber: localStorage.getItem(
                                        'current-receiver-account-number'
                                    ),
                                    isExternalTransaction: JSON.parse(
                                        localStorage.getItem(
                                            'is-external-transaction'
                                        )
                                    ),
                                    alias: 'Ng?????i d??ng ng??n h??ng kh??c',
                                };
                                fetch(
                                    process.env.REACT_APP_RECEIVER_API_URL_PATH,
                                    {
                                        method: 'POST',
                                        headers: {
                                            'Content-Type': 'application/json',
                                            Authorization:
                                                localStorage.getItem(
                                                    'accessToken'
                                                ),
                                        },
                                        body: JSON.stringify(payload),
                                    }
                                )
                                    .then((response) => {
                                        message.success(
                                            'L??u ng?????i nh???n th??nh c??ng'
                                        );
                                        getReceivers();
                                        getPaymentBankAccount();
                                        getPaymentBankAccountHistory();
                                    })
                                    .catch((error) =>
                                        message.error('L??u ng?????i nh???n th???t b???i')
                                    );

                                savedReceiverCheckbox.checked = false;
                            }
                        }

                        moneyTransferForm.resetFields();
                        setOtp([]);
                    },
                });
            })
            .catch((error) => {
                message.error(error);
            });
    };

    const handleMoneyTransferModalCancel = () => {
        toggleMoneyTransferModalVisible();
        moneyTransferForm.resetFields();
    };

    return (
        <ContentLayout>
            <Modal
                title='Th??m ng?????i nh???n'
                centered
                okText='X??c nh???n'
                cancelText='Hu???'
                onOk={handleConfirmAddReceiver}
                onCancel={toggleAddReceiverModalVisibility}
                open={addReceiverModalVisibility}>
                <Form layout='vertical' form={addReceiverForm}>
                    <Form.Item
                        name='receiverAccountNumber'
                        label='S??? t??i kho???n'
                        rules={[
                            {
                                required: true,
                                message: 'M???i b???n nh???p s??? t??i kho???n!!!',
                            },
                        ]}>
                        <Input placeholder='VD: 512315123' />
                    </Form.Item>
                    <Form.Item name='aliasName' label='T??n th?????ng g???i'>
                        <Input placeholder='VD: V??n A' />
                    </Form.Item>
                </Form>
            </Modal>

            <Modal
                title='X??c nh???n giao d???ch'
                centered
                okText='X??c nh???n'
                cancelText='Hu???'
                onOk={handleConfirmOtp}
                onCancel={toggleConfirmOtpModalVisibility}
                open={confirmOtpModalVisibility}>
                <OTPInput
                    autoFocus
                    length={4}
                    value={otp}
                    onChangeOTP={(value) => {
                        setOtp(value);
                    }}
                />
            </Modal>

            <Modal
                centered
                footer={null}
                title='T??i kho???n ng??n h??ng'
                open={changeAccountModalVisibility}
                onCancel={toggleChangeAccountModalVisible}>
                <BankAccountList
                    paymentAccount={paymentAccountInfo}
                    onSelectPaymentAccountClick={
                        handleSelectPaymentAccountClick
                    }
                    bankAccounts={bankAccounts}
                    onGetBankAccounts={getBankAccounts}
                />
            </Modal>

            <Modal
                centered
                footer={null}
                title='Chuy???n kho???n'
                open={moneyTransferModalVisibility}
                onCancel={handleMoneyTransferModalCancel}>
                <MoneyTransferForm
                    form={moneyTransferForm}
                    receivers={receivers}
                    bankTypes={bankTypes}
                    onAddReceiver={toggleAddReceiverModalVisibility}
                    transferMethods={transferMethods}
                    onDeleteReceiverClick={handleDeleteReceiverClick}
                    onConfirmTransfer={handleConfirmTransfer}
                    isConfirmTransferLoading={isConfirmTransferLoading}
                />
            </Modal>

            <GeneralInformationSection>
                {renderGeneralInformation()}
            </GeneralInformationSection>

            <ServiceSection>
                <ServiceList sources={services} />
            </ServiceSection>

            <HistorySection>
                <Title level={2}>L???ch s??? giao d???ch (trong 30 ng??y qua)</Title>
                {renderPaymentAccountHistoryTable()}
            </HistorySection>
        </ContentLayout>
    );
};
