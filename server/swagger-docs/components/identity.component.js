export default {
  Identity: {
    type: "object",
    properties: {
      email: {
        type: "string",
        description: "Email của tài khoản",
        example: "trantai@crossfitcoastal.com",
      },
      password: {
        type: "string",
        description: "Mật khẩu của tài khoản",
        example: "987654321",
      },
      firstName: {
        type: "string",
        description: "Tên",
        example: "Tài",
      },
      lastName: {
        type: "string",
        description: "Tên",
        example: "Trần",
      },
      phoneNumber: {
        type: "string",
        description: "Số điện thoại",
        example: "0793677776",
      },
      aliasName: {
        type: "string",
        description: "Tên gợi nhớ",
        example: "Trần Tài",
      },
    },
  },

  IdentityInput: {
    type: "object",
    properties: {
      email: {
        type: "string",
        description: "Email của tài khoản",
        example: "trantai@crossfitcoastal.com",
      },
      password: {
        type: "string",
        description: "Mật khẩu của tài khoản",
        example: "987654321",
      },
      firstName: {
        type: "string",
        description: "Tên",
        example: "Tài",
      },
      lastName: {
        type: "string",
        description: "Tên",
        example: "Trần",
      },
      phoneNumber: {
        type: "string",
        description: "Số điện thoại",
        example: "0793677776",
      },
      aliasName: {
        type: "string",
        description: "Tên gợi nhớ",
        example: "Trần Tài",
      },
    },
  },
};