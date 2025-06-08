export const USER_BASIC_FRAGMENT = `
  fragment UserBasic on User {
    id
    email
    fullName
    location
    phone
    isActive
    roles
  }
`;

export const USER_RESPONSE_FRAGMENT = `
  fragment UserResponseData on UserResponse {
    user {
      ...UserBasic
    }
  }
`;

export const USERS_RESPONSE_FRAGMENT = `
  fragment UsersResponseData on UsersResponse {
    users {
      ...UserBasic
    }
  }
`;

export const USER_DELETE_RESPONSE_FRAGMENT = `
  fragment UserDeleteResponseData on UserDeleteResponse {
    message
    success
  }
`;

export const FIND_ALL_USERS_QUERY = `
  ${USER_BASIC_FRAGMENT}
  ${USERS_RESPONSE_FRAGMENT}
  
  query FindAllUsers {
    findAllUsers {
      ...UsersResponseData
    }
  }
`;

export const FIND_USER_BY_ID_QUERY = `
  ${USER_BASIC_FRAGMENT}
  ${USER_RESPONSE_FRAGMENT}
  
  query FindUserById($id: String!) {
    findUserById(id: $id) {
      ...UserResponseData
    }
  }
`;

export const GET_MY_PROFILE_QUERY = `
  ${USER_BASIC_FRAGMENT}
  ${USER_RESPONSE_FRAGMENT}
  
  query GetMyProfile {
    getMyProfile {
      ...UserResponseData
    }
  }
`;

export const UPDATE_USER_MUTATION = `
  ${USER_BASIC_FRAGMENT}
  ${USER_RESPONSE_FRAGMENT}
  
  mutation UpdateUser($id: String!, $updateInput: UpdateUserDto!) {
    updateUser(id: $id, updateInput: $updateInput) {
      ...UserResponseData
    }
  }
`;

export const UPDATE_MY_PROFILE_MUTATION = `
  ${USER_BASIC_FRAGMENT}
  ${USER_RESPONSE_FRAGMENT}
  
  mutation UpdateMyProfile($updateInput: UpdateUserDto!) {
    updateMyProfile(updateInput: $updateInput) {
      ...UserResponseData
    }
  }
`;

export const DELETE_USER_MUTATION = `
  ${USER_DELETE_RESPONSE_FRAGMENT}
  
  mutation DeleteUser($id: String!) {
    deleteUser(id: $id) {
      ...UserDeleteResponseData
    }
  }
`;

export const DELETE_MY_ACCOUNT_MUTATION = `
  ${USER_DELETE_RESPONSE_FRAGMENT}
  
  mutation DeleteMyAccount {
    deleteMyAccount {
      ...UserDeleteResponseData
    }
  }
`;

export const USER_OPERATIONS = {
  queries: {
    findAllUsers: FIND_ALL_USERS_QUERY,
    findUserById: FIND_USER_BY_ID_QUERY,
    getMyProfile: GET_MY_PROFILE_QUERY,
  },
  mutations: {
    updateUser: UPDATE_USER_MUTATION,
    updateMyProfile: UPDATE_MY_PROFILE_MUTATION,
    deleteUser: DELETE_USER_MUTATION,
    deleteMyAccount: DELETE_MY_ACCOUNT_MUTATION,
  },
  fragments: {
    userBasic: USER_BASIC_FRAGMENT,
    userResponse: USER_RESPONSE_FRAGMENT,
    usersResponse: USERS_RESPONSE_FRAGMENT,
    userDeleteResponse: USER_DELETE_RESPONSE_FRAGMENT,
  },
};
