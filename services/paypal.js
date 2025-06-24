const axios = require("axios");

// PayPal Client Configuration
export function getPayPalClient() {
  // return new paypal.core.PayPalHttpClient(
  //     new paypal.core.SandboxEnvironment(process.env.PAYPAL_CLIENT_ID, process.env.PAYPAL_SECRET)
  // );

  const environment =
    process.env.PAYPAL_MODE === "live"
      ? new paypal.core.LiveEnvironment(
          process.env.PAYPAL_CLIENT_ID_LIVE,
          process.env.PAYPAL_SECRET_LIVE
        )
      : new paypal.core.SandboxEnvironment(
          process.env.PAYPAL_CLIENT_ID_TEST,
          process.env.PAYPAL_SECRET_TEST
        );

  return new paypal.core.PayPalHttpClient(environment);
}
