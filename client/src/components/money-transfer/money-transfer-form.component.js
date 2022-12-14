import { DeleteOutlined, PlusCircleFilled } from '@ant-design/icons';
import { styled } from '@xstyled/styled-components';
import {
    Button,
    Form,
    Input,
    InputNumber,
    Modal,
    Radio,
    Select,
    Skeleton,
    Space,
    Collapse,
    Tooltip,
    message,
    Typography,
} from 'antd';
import { useEffect, useState } from 'react';
import { ReceiverItem } from './receiver-item.component.js';

const { Panel } = Collapse;

const { Option } = Select;

const { Text } = Typography;

const Container = styled.div`
    margin: 20px 10px;
`;

const StyledDepositInput = styled(InputNumber)`
    width: 100%;
`;

const FloatRight = styled.div`
    float: right;
`;

const CenterText = styled.div`
    text-align: center;
`;

const ReceiverItemContainer = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-radius: 4px;
    padding: 10px 0;

    &:hover {
        background: lightgray;
        cursor: pointer;
        transition: background 0.25s;
    }
`;

const ActionFields = styled(Space)`
    margin: 0 5px;
`;

export const MoneyTransferForm = ({
    form,
    receivers,
    bankTypes,
    transferMethods,
    onAddReceiver,
    onDeleteReceiverClick,
    onConfirmTransfer,
    isConfirmTransferLoading,
}) => {
    const [isValid, setIsValid] = useState(null);
    const [isLoadingCheckReceiver, setLoadingCheckReceiverStatus] =
        useState(false);
    const handleReceiverItemClick = (receiver) => {
        form.setFieldsValue({
            receiverAccountNumber: receiver.accountNumber,
            bankTypeId: receiver.bankType.id,
        });
    };

    const renderReceiverOptions = () =>
        receivers === null ? (
            <Skeleton />
        ) : (
            receivers.map((r) => (
                <ReceiverItemContainer>
                    <ReceiverItem
                        onSelectItemClick={handleReceiverItemClick}
                        receiver={r}
                    />
                    <ActionFields direction='horizontal'>
                        <Button
                            type='text'
                            onClick={() => onDeleteReceiverClick(r._id)}
                            icon={<DeleteOutlined />}
                        />
                    </ActionFields>
                </ReceiverItemContainer>
            ))
        );

    const handleCheckReceiverExist = () => {
        setLoadingCheckReceiverStatus(true);

        const { receiverAccountNumber, bankTypeId } = form.getFieldsValue();
        if (!receiverAccountNumber) {
            message.error('S??? t??i kho???n ??ang tr???ng!!!');
            setLoadingCheckReceiverStatus(false);
            return;
        }

        if (!bankTypeId) {
            message.error('Lo???i ng??n h??ng ??ang tr???ng!!!');
            setLoadingCheckReceiverStatus(false);
            return;
        }

        console.log('form.getFieldsValue()', form.getFieldsValue());
        const url = `${process.env.REACT_APP_BANK_ACCOUNT_API_URL_PATH}/by-account-number-and-bank-type?accountNumber=${receiverAccountNumber}&bankTypeId=${bankTypeId}`;

        fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                Authorization: localStorage.getItem('accessToken'),
            },
        })
            .then((response) => response.json())
            .then((value) => {
                setLoadingCheckReceiverStatus(false);

                if (value.message) {
                    setIsValid(false);
                    message.error(value.message);
                } else {
                    setIsValid(true);
                    Modal.success({
                        title: 'T??i kho???n h???p l???',
                        content: (
                            <strong>
                                <p>
                                    <strong>S??? t??i kho???n: </strong>{' '}
                                    {value.accountNumber}
                                </p>
                                <p>
                                    <strong>T??n th?????ng g???i: </strong>
                                    {value.user.fullname}
                                </p>
                                <p>
                                    <strong>Email: </strong>
                                    {value.user.email}
                                </p>
                                <p>
                                    <strong>S??? ??i???n tho???i: </strong>
                                    {value.user.phone}
                                </p>
                            </strong>
                        ),
                    });
                }

                setTimeout(() => {
                    setIsValid(null);
                }, 5000);
            });
    };

    const renderBankTypeOptions = () =>
        bankTypes === null ? (
            <Skeleton />
        ) : (
            bankTypes.map((b) => <Option key={b._id}>{b.name}</Option>)
        );
    const renderTransferMethodOptions = () =>
        transferMethods === null ? (
            <Skeleton />
        ) : (
            transferMethods.map((t) => (
                <Radio value={t._id}>
                    {t.name === 'Sender Pay Transfer Fee'
                        ? 'Ng?????i g???i thanh to??n'
                        : 'Ng?????i nh???n thanh to??n'}
                </Radio>
            ))
        );

    console.log('isValid', isValid);

    return (
        <Container>
            <Form form={form} layout='vertical'>
                <CenterText>
                    {isValid !== null &&
                        isValid !== undefined &&
                        (isValid === true ? (
                            <Text type='success'>
                                T??i kho???n h???p l??? (th??ng b??o n??y s??? t??? bi???n m???t
                                sau 5s)
                            </Text>
                        ) : (
                            <Text type='danger'>
                                T??i kho???n ch??a ???????c x??c minh (th??ng b??o n??y s???
                                t??? bi???n m???t sau 5s)
                            </Text>
                        ))}
                </CenterText>

                <Form.Item
                    name='receiverAccountNumber'
                    label='S??? t??i kho???n ng?????i nh???n'
                    rules={[
                        {
                            required: true,
                            message: 'M???i b???n nh???p s??? t??i kho???n c???a ng?????i nh???n',
                        },
                    ]}>
                    <Input placeholder='V?? d???: 012345678910' />
                </Form.Item>
                <Form.Item
                    name='bankTypeId'
                    label='Lo???i ng??n h??ng'
                    rules={[
                        {
                            required: true,
                            message: 'M???i b???n ch???n lo???i ng??n h??ng',
                        },
                    ]}>
                    <Select placeholder='Vui l??ng ch???n 1 ng??n h??ng c???n chuy???n'>
                        {renderBankTypeOptions()}
                    </Select>
                </Form.Item>
                <Form.Item>
                    <FloatRight>
                        <Button
                            type='default'
                            onClick={handleCheckReceiverExist}
                            loading={isLoadingCheckReceiver}>
                            Ki???m tra ng?????i nh???n
                        </Button>
                    </FloatRight>
                </Form.Item>
                <Form.Item>
                    <Collapse defaultActiveKey={['1']}>
                        <Panel
                            header='Ho???c ch???n ng?????i nh???n t??? danh s??ch ???? l??u'
                            extra={
                                <Tooltip title='Th??m ng?????i nh???n m???i'>
                                    <Button
                                        type='text'
                                        icon={<PlusCircleFilled />}
                                        onClick={onAddReceiver}
                                    />
                                </Tooltip>
                            }
                            key='1'>
                            {renderReceiverOptions()}
                        </Panel>
                    </Collapse>
                </Form.Item>

                <Form.Item
                    name='deposit'
                    label='S??? ti???n chuy???n'
                    rules={[
                        {
                            required: true,
                            message: 'M???i b???n nh???p s??? ti???n c???n chuy???n',
                        },
                    ]}>
                    <StyledDepositInput
                        addonAfter='VN??'
                        placeholder='V?? d???: 200000'
                    />
                </Form.Item>
                <Form.Item
                    name='transferMethodId'
                    label='H??nh th???c thanh to??n ph??'
                    rules={[
                        {
                            required: true,
                            message: 'M???i b???n ch???n h??nh th???c thanh to??n ph??',
                        },
                    ]}>
                    <Radio.Group>{renderTransferMethodOptions()}</Radio.Group>
                </Form.Item>
                <Form.Item name='description' label='N???i dung chuy???n kho???n'>
                    <Input placeholder='V?? d???: Ti???n c?? ph?? h??m tr?????c' />
                </Form.Item>

                <Button
                    type='primary'
                    block
                    loading={isConfirmTransferLoading}
                    onClick={onConfirmTransfer}>
                    X??c nh???n
                </Button>
            </Form>
        </Container>
    );
};
