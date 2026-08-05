const test = require("node:test")
const assert = require("node:assert/strict")
const { getDefaultPermissions, normalizePermissionsForRole } = require("../src/utils/permissionConfig")

test("getDefaultPermissions returns default admin and customer permission sets", () => {
  const permissions = getDefaultPermissions()
  assert.ok(permissions.admin)
  assert.ok(permissions.costumer)
  assert.equal(permissions.admin.dashboard_view, true)
  assert.equal(permissions.costumer.submit_adoption, true)
})

test("normalizePermissionsForRole keeps every permission key and casts booleans", () => {
  const normalized = normalizePermissionsForRole(
    [
      { key: "dashboard_view", allowed: "true" },
      { key: "manage_animals", allowed: false },
    ],
    ["dashboard_view", "manage_animals"],
  )

  assert.deepEqual(normalized, {
    dashboard_view: true,
    manage_animals: false,
  })
})
