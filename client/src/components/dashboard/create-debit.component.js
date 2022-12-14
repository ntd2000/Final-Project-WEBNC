import React, { useState } from "react";
import { Button, Modal, Form, Input, Avatar, message, Tooltip } from "antd";
import {
  MoneyCollectOutlined,
  BankOutlined,
  HighlightOutlined,
} from "@ant-design/icons";
import { useStore } from "../../store";

const { TextArea } = Input;

const CreateDebitModal = ({ actions, debtAccount }) => {
  const [state, dispatch] = useStore();
  const { paymentAccountNumber } = state;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  const onFinish = async (values) => {
    setLoading(true);
    let debtAccountNumber;
    if (debtAccount) {
      debtAccountNumber = debtAccount;
    } else debtAccountNumber = values.debtAccountNumber;
    const { amountToPay, content } = values;

    const accountNumber = paymentAccountNumber;
    const data = JSON.stringify({
      accountNumber,
      debtAccountNumber,
      amountToPay,
      content,
    });

    const result = await fetch(process.env.REACT_APP_DEBIT_URL_PATH, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        authorization: localStorage.getItem("accessToken"),
      },
      body: data,
    })
      .then((response) => response.json())
      .then((data) => data);

    messageApi.open({
      type: result.status,
      content: result.message,
    });

    form.resetFields();
    setLoading(false);
  };

  const showModal = () => {
    setIsModalOpen(true);
  };

  const handleCancel = async () => {
    setIsModalOpen(false);
    if (!debtAccount) {
      actions.setLoading(true);
      await actions
        .fetchApi("personal")
        .then((result) => actions.setData(result));
      actions.setLoading(false);
    }
  };
  return (
    <>
      {!debtAccount ? (
        <Button
          type="primary"
          onClick={showModal}
          icon={<HighlightOutlined />}
          style={{ marginBottom: "5px" }}
        >
          T???o nh???c n???
        </Button>
      ) : (
        <Tooltip placement="top" title="T???o nh???c n???">
          <Button
            type="primary"
            onClick={showModal}
            icon={<HighlightOutlined />}
          ></Button>
        </Tooltip>
      )}

      <Modal
        footer={null}
        title="T???o nh???c n???"
        open={isModalOpen}
        onCancel={handleCancel}
      >
        <div
          style={{
            border: "1px solid #1677ff",
            borderRadius: "20px",
            paddingLeft: "20px",
            paddingRight: "20px",
          }}
        >
          <div style={{ textAlign: "center", margin: "20px" }}>
            <Avatar size={200} src="/images/debt.png"></Avatar>
          </div>
          <Form
            form={form}
            name="normal_login"
            className="login-form"
            onFinish={onFinish}
            style={{ width: "100%" }}
          >
            {!debtAccount && (
              <Form.Item
                name="debtAccountNumber"
                rules={[
                  {
                    required: true,
                    message: "M???i b???n nh???p s??? t??i kho???n ng?????i c???n nh???c n???!",
                  },
                ]}
              >
                <Input
                  prefix={<BankOutlined className="site-form-item-icon" />}
                  placeholder="S??? t??i kho???n n???"
                />
              </Form.Item>
            )}

            <Form.Item
              name="amountToPay"
              rules={[
                {
                  required: true,
                  message: "M???i b???n nh???p s??? ti???n ph???i tr???!",
                },
              ]}
            >
              <Input
                prefix={
                  <MoneyCollectOutlined className="site-form-item-icon" />
                }
                placeholder="S??? ti???n ph???i tr???"
              />
            </Form.Item>

            <Form.Item
              name="content"
              rules={[
                {
                  required: true,
                  message: "M???i b???n nh???p n???i dung nh???c n???!",
                },
              ]}
            >
              <TextArea rows={4} placeholder="N???i dung nh???c n???" />
            </Form.Item>

            <Form.Item>
              {contextHolder}
              <Button
                style={{ width: "100%" }}
                type="primary"
                htmlType="submit"
                className="login-form-button"
                loading={loading}
              >
                T???o nh???c n???
              </Button>
            </Form.Item>
          </Form>
        </div>
      </Modal>
    </>
  );
};
export default CreateDebitModal;
