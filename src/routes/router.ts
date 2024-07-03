import { Router, Request, Response } from 'express';
import checkusertype from '../middlewares/checkusertype';

// import { getData } from '../middlewares/getClinicId';

import { createUser } from '../controller/createuser';
import validationschema from '../validation/validation';

import { loginuser } from '../controller/login';

import { authenticateuser } from '../controller/authenticate';
import { unauthorizeduser } from '../controller/unauthorized';

import { userdetails } from '../controller/userdetails';

import { addproducts } from '../controller/addproducts';
import upload from '../middlewares/multer';

import { multererror } from '../controller/multererror';
import { validationforproduct } from '../validation/addProduct';

import getData from '../middlewares/getClinicId';

import getClinicPatientDeathReport from '../controller/test';
import { getemrdetails } from '../controller/get_emrdetails';

import { employedetails } from '../controller/getemploye';
import { createemployee } from '../controller/createemployee';
import { maxandminsalary } from '../controller/get_minandmax_saalry';
import { frontDeskPatientList } from '../controller/get_frontDeskPatientList';
import { frontDeskPatientListValidator } from '../middlewares/frontDeskPatientListValidator';
import { getFrontResentList } from '../helper/get_front_resent_list';
import { chechauth } from '../middlewares/checkauth';


const routes = Router();

routes.get('/', (req: Request, res: Response) => {
    console.log(req.body);
    res.send("Welcome to the application");
});
routes.get("/testingapis/:q", getClinicPatientDeathReport)


routes.get("/auth", checkusertype, (req: Request, res: Response) => {
    res.send("allow to use this page !!")
})
routes.get("/getemrdetails",chechauth,getemrdetails);

routes.get("/getfrontdeskdetails",chechauth,frontDeskPatientListValidator,frontDeskPatientList)

// routes.get("/getdata", getFrontResentList);

routes.post("/createuser", validationschema, createUser.createUser);

routes.get("/authenticated", authenticateuser.authenticateuser);

routes.get("/unauthorized", unauthorizeduser.unauthorizeduser);

routes.post("/loginuser", loginuser.loginuser);

routes.get("/userdetails", userdetails.userdetails);

routes.post("/addproducts", validationforproduct, upload.single('image'), addproducts.addproducts);


routes.get("/employedetails", employedetails.employedetails)
routes.post("/createemploye" , createemployee.createemployee)
routes.get("/maxandminsalary",maxandminsalary.maxandminsalary)
routes.use(multererror.multererror);
export default routes;