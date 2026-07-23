const express = require("express")
const superadminController = require("../controllers/superadminController")

const router = express.Router()

router.get("/superadmin/dashboard", superadminController.getDashboard)
router.get("/superadmin/users", superadminController.getUsers)
router.post("/superadmin/users", superadminController.createUser)
router.put("/superadmin/users/:id", superadminController.updateUser)
router.delete("/superadmin/users/:id", superadminController.deleteUser)
router.get("/superadmin/animals", superadminController.getAnimals)
router.post("/superadmin/animals", superadminController.createAnimal)
router.put("/superadmin/animals/:id", superadminController.updateAnimal)
router.delete("/superadmin/animals/:id", superadminController.deleteAnimal)

module.exports = router
