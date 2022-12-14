import React, { useEffect, useState } from "react";
import {
  Dropdown,
  Button,
  Badge,
  Space,
  notification,
  Typography,
} from "antd";
import { BellOutlined } from "@ant-design/icons";
import { useStore } from "../../store";

const { Title, Text } = Typography;

const getItem = (label, key, icon, children) => {
  return {
    key,
    icon,
    children,
    label,
  };
};

function NotifyMessage({ message, time, id, fetchApi, setLoading }) {
  const handleClick = async () => {
    setLoading(true);
    const url = `${process.env.REACT_APP_NOTIFY_URL_PATH}/${id}`;
    const result = await fetch(url, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        authorization: localStorage.getItem("accessToken"),
      },
    })
      .then((response) => response.json())
      .then((data) => data);
    await fetchApi();
    setLoading(false);
  };

  return (
    <div style={{border:"1px solid gray", padding:"10px", borderRadius:"10px"}}>
      <Space align="start" direction="vertical">
        <Title level={5}>Thông báo</Title>
        <Text>{message}</Text>
        <Text type="secondary">{time}</Text>
      </Space>
      <div style={{ width: "100%", textAlign:"right" }}>
        <Button size="small" danger onClick={handleClick}>
          Xóa
        </Button>
      </div>
    </div>
  );
}

function Notify() {
  const [state, dispatch] = useStore()
  const {paymentAccountNumber} = state
  const [dropItems, setDropItems] = useState([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchApi = async () => {
    setLoading(true);
    const url = `${
      process.env.REACT_APP_NOTIFY_URL_PATH
    }/${paymentAccountNumber}`;
    const result = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        authorization: localStorage.getItem("accessToken"),
      },
    })
      .then((response) => response.json())
      .then((data) => data);
    let items = result.notifies.map((notify, index) => {
      let message = `Tài khoản ${notify.senderId.accountNumber} đã thanh toán nhắc nợ của bạn`;
      if (notify.statusId.name === "cancelled") {
        if (notify.side === "personal") {
          message = `Nhắc nợ của tài khoản ${notify.senderId.accountNumber} đã bị hủy`;
        } else
          message = `Tài khoản ${notify.senderId.accountNumber} đã hủy nhắc nợ của bạn`;
      }else if(notify.statusId.name === "unpaid"){
        message = `Tài khoản ${notify.senderId.accountNumber} đã gửi cho bạn một nhắc nợ`;
      }
      return getItem(
        <NotifyMessage
          message={message}
          time={new Date(parseInt(notify.createdAt)).toLocaleString()}
          id={notify._id}
          setLoading={setLoading}
          fetchApi={fetchApi}
        ></NotifyMessage>,
        index
      );
    });
    if (items.length === 0) {
      items = [getItem(`Không có thông báo`, 1)];
    }
    setDropItems(items);
    setCount(result.count);
    setLoading(false);
  };

  useEffect(() => {
    const paymentAccount = paymentAccountNumber;
    const ws = new WebSocket(`${process.env.REACT_APP_WS_URL_PATH}`);
    if (paymentAccount) {
      fetchApi();

      ws.onopen = (event) => {
        ws.send(`${paymentAccount}`);
      };
      ws.onmessage = async function (event) {
        const message = event.data;
        if (message === paymentAccount) {
          setLoading(true);
          await fetchApi();
          setLoading(false);
          notification.open({
            message: "Thông báo",
            description:
              "Bạn có thông báo mới về nhắc nợ, hãy kiểm tra trong danh sách nhắc nợ",
            placement: "top",
          });
        }
      };
    }
    return () => ws.close();
  }, [paymentAccountNumber]);

  return (
    <Dropdown
      menu={{
        items: dropItems,
      }}
      placement="bottomLeft"
      arrow={{
        pointAtCenter: true,
      }}
      trigger={["click"]}
    >
      <Badge size="small" count={count}>
        <Button loading={loading} icon={<BellOutlined />}></Button>
      </Badge>
    </Dropdown>
  );
}

export default Notify;
