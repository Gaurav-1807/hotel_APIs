// import{Router} from 'express'
import routes from './router'

// const router = Router()
// router.use(routes)

// export default router

import { Router } from 'express';

class IndexRoute {
    public rout: Router = Router();

    constructor() {
        this.config();
    }

    config(): void {
        this.rout.use("/",routes)
    }

}
const indexRoute = new IndexRoute();
export default indexRoute.rout;