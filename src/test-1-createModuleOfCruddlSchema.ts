import { createServer } from "@graphql-yoga/node";
import { createYoga, createSchema } from "graphql-yoga";
import { useGraphQLModules } from "@envelop/graphql-modules";
import fs from "fs";
import path from "path";
import { Project } from "cruddl";
import { createModule, createApplication } from "graphql-modules";

import { helloModuleSdlObject } from "./hello-module";

// create a module from helloSdl for reference
const helloModule = createModule({
  id: "hello-module",
  dirname: __dirname,
  ...helloModuleSdlObject,
});
console.log("helloModule SDL: ", helloModuleSdlObject);
console.log("helloModule (module object reference): ", helloModule);

// create a schema from helloSdl for reference
const helloSchema = createSchema(helloModuleSdlObject);
console.log("helloSchema (schema object reference)", helloSchema);

// Import and initialize InMemoryAdapter for Cruddle tests
import { InMemoryAdapter } from "cruddl";
const db = new InMemoryAdapter();

// load cruddl sdl from file
// note: the sdl are only types. resolvers are created by cruddle automatically
const loadCruddlSdlFromFile = fs.readFileSync(path.join(__dirname + "/test-cruddl-sdl.graphqls")).toString();

console.log("cruddl SDL: ", loadCruddlSdlFromFile);
// inject cruddle sdl into cruddle project sdl source and initialize cruddl project
const project = new Project({
  sources: [
    {
      name: "schema.graphqls",
      body: `${loadCruddlSdlFromFile}`,
    },
    {
      name: "permission-profiles.json",
      body: JSON.stringify({
        permissionProfiles: {
          default: {
            permissions: [
              {
                roles: ["users"],
                access: "readWrite",
              },
            ],
          },
        },
      }),
    },
  ],
  getExecutionOptions: ({ context }) => ({ authContext: { authRoles: ["users"] } }),
  getOperationIdentifier: ({ context }) => context as object, // each operation is executed with an unique context object
});

// create cruddle schema
const cruddlSchema = project.createSchema(db);
console.log("cruddle schema object", cruddlSchema);

// suggested way of converting schema to module in https://github.com/jycouet/kitql/discussions/260#discussioncomment-4051505
// note: not working, because the schema is already a GraphQLSchema which does not have the necessary properties (typeDefs, resolvers) as an sdl object would have

// const cruddleModule = createModule ({
//     id:'cruddle-module',
//     typeDefs: schema.typeDefs,
//     resolvers: schema.resolvers
// })

// note: starting a graphql server via modules / application server (alternatively use code below)

const application = createApplication({
  modules: [
    helloModule,
    // cruddlModule
  ],
});

const server = createServer({
  plugins: [useGraphQLModules(application)],
  port: 4000,
});

server.start().then(() => {
  console.log(`🚀 Server ready on http://localhost:4000/graphql`);
});

//note: alternatively for when server is created directly with yoga and is injected a schema
// Create a Yoga instance with a GraphQL schema.
// const yoga = createYoga({ someSchema })

// Pass it into a server to hook into request handlers.
// const server = createServer(yoga)

// Start the server and you're done!
// server.listen(4000, () => {
//   console.info("Server is running on http://localhost:4000/graphql");
// });
