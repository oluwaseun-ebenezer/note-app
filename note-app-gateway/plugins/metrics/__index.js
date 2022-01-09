const client = require("prom-client");

const statusCodeCounter = new client.Counter({
  name: "status_codes",
  help: "status_code_counter",
  labelNames: ["type", "status_code", "apiendpoint", "api_url"],
});

module.exports = {
  version: "1.0.0",
  policies: ["metrics"],
  schema: {
    $id: "http://express-gateway.io/plugins/metrics.json",
    type: "object",
    properties: {
      endpointName: {
        type: "string",
        default: "/metrics",
      },
    },
    required: ["endpointName"],
  },
  init: function (pluginContext) {
    pluginContext.registerGatewayRoute((app) => {
      app.get(pluginContext.settings.endpointName, async (req, res) => {
        if (req.accepts(client.register.contentType)) {
          res.contentType(client.register.contentType);
          return res.send(await client.register.metrics());
        }

        return res.json(await client.register.getMetricsAsJSON());
      });
    });

    pluginContext.registerPolicy({
      name: "metrics",
      policy: () => (req, res, next) => {
        res.once("finish", () => {
          const apiEndpoint = req.egContext.apiEndpoint.apiEndpointName;
          const statusCode = res.statusCode.toString();
          const responseType =
            res.statusCode >= 200 && res.statusCode < 300
              ? "SUCCESS"
              : "FAILED";
          const api_url = req.egContext.req.path;
          statusCodeCounter
            .labels(responseType, statusCode, apiEndpoint, api_url)
            .inc();
        });

        next();
      },
    });
  },
};
