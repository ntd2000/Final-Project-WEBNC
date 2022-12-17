import Title from 'antd/es/typography/Title.js';
import { AppLayout } from '../components/common/index.js';
import styled from '@xstyled/styled-components';
import { Button, Modal, Skeleton, Table, Tabs } from 'antd';
import { ServiceList } from '../components/dashboard/index.js';
import { ContactsOutlined, SwapOutlined } from '@ant-design/icons';
import { useEffect, useState } from 'react';
import { getProfileFromLocalStorage } from '../utils/local-storage.util.js';
import { BankAccountList } from '../components/dashboard/bank-account-list.component.js';
import { MoneyTransferForm } from '../components/money-transfer/money-transfer-form.component.js';

const GeneralInformationSection = styled.div`
    display: flex;
    justify-content: space-between;
`;

const ServiceSection = styled.div`
    margin: 30px 0px;
`;

const HistorySection = styled.div``;

export const DashBoardPage = () => {
    const [paymentAccountInfo, setPaymentAccount] = useState(null);
    const [bankAccounts, setBankAccountList] = useState([]);
    const [changeAccountModalVisibility, setChangeAccountModalVisibility] =
        useState(false);
    const [moneyTransferModalVisibility, setMoneyTransferModalVisibility] =
        useState(false);

    useEffect(() => {
        const fetchApi = async () => {
            const apiUrl = `${process.env.REACT_APP_BANK_ACCOUNT_API_URL_PATH}?isPayment=true`;

            await fetch(apiUrl, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: localStorage.getItem('accessToken'),
                },
            })
                .then((response) => response.json())
                .then((data) => {
                    setPaymentAccount(data[0]);
                });
        };

        fetchApi();
    }, []);

    const toggleChangeAccountModalVisible = () =>
        setChangeAccountModalVisibility(!changeAccountModalVisibility);

    const toggleMoneyTransferModalVisible = () =>
        setMoneyTransferModalVisibility(!moneyTransferModalVisibility);

    const services = [
        {
            icon: <SwapOutlined />,
            name: 'Chuyển tiền',
            onClick: toggleMoneyTransferModalVisible,
        },
        {
            icon: <ContactsOutlined />,
            name: 'Ghi nợ',
            onClick: () => {},
        },
    ];

    const dataSource = [];

    const columns = [
        {
            title: 'Số tài khoản',
            dataIndex: 'receiverId',
            key: 'receiverId',
        },
        {
            title: 'Số tiền',
            dataIndex: 'money',
            key: 'money',
        },
        {
            title: 'Hình thức',
            dataIndex: 'method',
            key: 'method',
        },
        {
            title: 'Nội dung',
            dataIndex: 'description',
            key: 'description',
        },
    ];

    const onChangeAccountClick = () => {
        const fetchApi = async () => {
            await fetch(process.env.REACT_APP_BANK_ACCOUNT_API_URL_PATH, {
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
        };

        fetchApi();

        toggleChangeAccountModalVisible();
    };

    const renderGeneralInformation = () =>
        paymentAccountInfo === null ? (
            <Skeleton />
        ) : (
            <>
                <div>
                    <Title level={2}>General Information</Title>
                    <p>Account Number: {paymentAccountInfo.accountNumber}</p>
                    <p>
                        Account Name: {getProfileFromLocalStorage().aliasName}
                    </p>
                    <p>Over Balance: {paymentAccountInfo.overBalance}</p>
                </div>
                <Button type='primary' onClick={onChangeAccountClick}>
                    Change Account
                </Button>
            </>
        );

    return (
        <AppLayout>
            <Modal
                footer={null}
                title='Bank Accounts'
                open={changeAccountModalVisibility}
                onCancel={toggleChangeAccountModalVisible}>
                <BankAccountList bankAccounts={bankAccounts} />
            </Modal>

            <Modal
                footer={null}
                title='Money Transfer'
                open={moneyTransferModalVisibility}
                onCancel={toggleMoneyTransferModalVisible}>
                <MoneyTransferForm />
            </Modal>

            <GeneralInformationSection>
                {renderGeneralInformation()}
            </GeneralInformationSection>

            <ServiceSection>
                <ServiceList sources={services} />
            </ServiceSection>

            <HistorySection>
                <Title level={2}>History</Title>
                <Table dataSource={dataSource} columns={columns} />
            </HistorySection>
        </AppLayout>
    );
};
