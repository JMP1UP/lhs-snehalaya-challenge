export const msalConfig = {
  auth: {
    clientId: "c846091f-47bc-4454-9eb4-235cfaa83d7a",
    authority:
      "https://login.microsoftonline.com/89b66541-893d-4f1a-926d-17941da298a1",
    redirectUri: "http://localhost:5173",
  },
  cache: {
    cacheLocation: "sessionStorage",
    storeAuthStateInCookie: false,
  },
};

export const loginRequest = {
  scopes: ["User.Read"],
};
