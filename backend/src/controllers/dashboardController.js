const dashboardModel = require("../models/dashboardModel")

function getSuperadminDashboard(req, res) {
  res.json({
    success: true,
    data: dashboardModel.getDashboardData(),
  })
}

module.exports = {
  getSuperadminDashboard,
}
