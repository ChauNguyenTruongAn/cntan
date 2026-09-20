#Setup

<>
npm install @apollo/server graphql dataloader dotenv @prisma/client
</>

<>
npm install -D typescript tsx @types/node prisma
</>

config tsconfig.json, run this command to generate file
<>
npx tsc --init
</>

init prisma
<>npx prisma orm init</>

infer database
<>npx prisma contract infer --output ./src/prisma/contract.prisma</>

emit database

run <>npm install temporal-polyfill </>
note: when query database, place <>import "temporal-polyfill/full/global";</> 
before <>import {db} from './src/prisma/db.js</>

separate typeDefs to each features
<> npm i graphql-tag</>

note: when set DB environment different with DATABASE_URL
        we have to declare in entry file <>db.connect({url: $DB_URL})</>

hash password (bcrypt)
<>
    npm i bcrypt
    npm i -D @types/bcrypt
</>

create token with jose
<>npm install jose
</>
