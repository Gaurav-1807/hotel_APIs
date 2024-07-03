const mysql = require('mysql2');
require('dotenv').config();
import "reflect-metadata";

const connectionPool = mysql.createPool({
    connectionLimit: 2,
    multipleStatements: true,
    debug: false,
    host: process.env.DB_HOST,
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB,
});

class readDb {
    public async select (query: any, data: any[]): Promise<any>{
        return new Promise((resolve, reject) => {
            connectionPool.getConnection((err : any, connection : any) => {
                if (err) {
                    console.log("error -> ",err)
                    connection.destroy()
                    reject(err)
                }
                connection.query(query, data, (error : any, results :any) => {
                    if(error){
                        console.log("error -> ",error)
                        connection.destroy()
                        return reject(error)
                    }
                    connection.destroy()
                    return resolve(results)
                })
            });
            
        })
    }
}

export const readConnection = new readDb();