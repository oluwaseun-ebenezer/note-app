const client = require("prom-client");

const register = new client.Registry();

register.setDefaultLabels({ app: "note-app-gateway" });

client.collectDefaultMetrics({ register });

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
        console.log("gateway metrics");
        if (req.accepts(register.contentType)) {
          res.contentType(register.contentType);
          return res.send(await register.metrics());
        }

        return res.send(await register.metrics());
      });
    });

    pluginContext.registerPolicy({
      name: "metrics",
      policy: () => (req, res, next) => {
        next();
      },
    });
  },
};
