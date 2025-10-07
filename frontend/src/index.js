/*!

=========================================================
* Argon Dashboard Chakra - v1.0.0
=========================================================

* Product Page: https://www.creative-tim.com/product/argon-dashboard-chakra
* Copyright 2022 Creative Tim (https://www.creative-tim.com)
* Licensed under MIT (https://github.com/creativetimofficial/argon-dashboard-chakra/blob/master/LICENSE.md)

* Design and Coded by Simmmple & Creative Tim

=========================================================

* The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

*/
import React from "react";
import ReactDOM from "react-dom";
import { HashRouter, Route, Switch, Redirect } from "react-router-dom";

import AuthLayout from "layouts/Auth.js";
import AdminLayout from "layouts/Admin.js";
// Chakra imports
import { ChakraProvider } from "@chakra-ui/react";
// Custom Chakra theme
import theme from "theme/theme.js";
// Notification Context
import { NotificationProvider } from "contexts/NotificationContext.js";
// Group Context
import { GroupProvider } from "contexts/GroupContext.js";
// Auth Context
import { AuthProvider } from "contexts/AuthContext.js";
// Protected Route Component
import ProtectedRoute from "components/ProtectedRoute/ProtectedRoute.js";

ReactDOM.render(
  <ChakraProvider theme={theme} resetCss={false} position="relative">
    <AuthProvider>
      <NotificationProvider>
        <GroupProvider>
          <HashRouter>
            <Switch>
              <Route path={`/auth`} component={AuthLayout} />
              <Route path={`/admin`}>
                <ProtectedRoute>
                  <AdminLayout />
                </ProtectedRoute>
              </Route>
              <Redirect from={`/`} to="/auth/signup" />
            </Switch>
          </HashRouter>
        </GroupProvider>
      </NotificationProvider>
    </AuthProvider>
  </ChakraProvider>,
  document.getElementById("root")
);
