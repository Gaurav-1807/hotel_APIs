import jwt from 'jsonwebtoken';

const secretKey = 'your-secret-key'; // Use an environment variable in a real application

const generatetoken = (id: string) => {
    return jwt.sign({ id }, secretKey, { expiresIn: '1h' });
};

export default generatetoken;
/*  
    table 1 : tbl_employe_details
        emp_id int NOT NULL unique auto_increment,
         user_name varchar(100) not null,
        email varchar(100) not null unique,
        password varchar(250),
        address varchar(100) not null,
        create_dt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP ,
        mobile_no int ,
        phone_code varchar(200),
        country_code varchar(200),
        state varchar(200),
        city varchar(150),
        employe_type varchar(150),
        primary key(emp_id)

    table 2 : tbl_employe_type
        type_id int NOT NULL unique auto_increment,
        field_name varchar(100) not null,
        primary key(type_id)

    table 3 : tbl_employe_salary :
        salary_id int NOT NULL unique auto_increment,
        emp_id int ,
        type_id int ,
        salary int,
        primary key(salary_id),
        FOREIGN KEY (emp_id) REFERENCES tbl_employe_details(emp_id),
	    FOREIGN KEY (type_id) REFERENCES tbl_emplyee_type(type_id)
*/