import multer from 'multer';
import path from 'path';
import { readConnection } from '../config/db';
import "reflect-metadata";
const getpid = async () => {
    try {
        const data = await readConnection.select('SELECT MAX(p_id) as maxpid FROM product_details', []);
        const nextpid = data[0].maxpid + 1
        return nextpid;

    } catch (err) {
        console.error('Error:', err);
        return err;
    }
}
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'images/');
    },
    filename: async (req, file, cb) => {
        const pid = await getpid();
        console.log(pid)
        cb(null, `${pid}_${Date.now()}-${file.originalname}`);
    }
});

// const upload = multer({ storage: storage });

const upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        if (file.mimetype == "image/png" || file.mimetype == "image/jpg" || file.mimetype == "image/jpeg") {
            cb(null, true);
        } else {
            cb(null, false);
            return cb(new Error('Only .png, .jpg and .jpeg format allowed!'));
        }
    }

});

export default upload;

