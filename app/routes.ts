import {
  type RouteConfig,
  index,
  route,
  layout,
} from "@react-router/dev/routes";

export default [
  index("modules/auth/index.tsx"),
  layout("shared/components/app-layout.tsx", [
    route("/dashboard", "modules/dashboard/index.tsx"),
    route("/reports", "modules/reports/index.tsx"),
    route("/reports/:id", "modules/report/index.tsx"),
    route("/c/:collection", "modules/collection/index.tsx"),
  ]),
] satisfies RouteConfig;
