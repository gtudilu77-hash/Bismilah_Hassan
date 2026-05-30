import dotenv from "dotenv";
dotenv.config();

import { createRequire } from "module";
const require = createRequire(import.meta.url);

const Face = require("@azure/cognitiveservices-face");
const msRest = require("@azure/ms-rest-js");
const fs = require("fs");

const credentials = new msRest.ApiKeyCredentials({
    inHeader: {
        "Ocp-Apim-Subscription-Key": process.env.AZURE_FACE_KEY
    }
});

const faceClient = new Face.FaceClient(
    credentials,
    process.env.AZURE_FACE_ENDPOINT
);

const GROUP_ID = "aves_users";

const peopleToRegister = [
    { name: "Tudilu Manuel", photo: "./tudilu.jpeg" },
    { name: "Kiami de Almeida", photo: "./kiami.jpeg" },
    { name: "Elijah Gomes", photo: "./Elijah.jpeg" }
];

async function registerAll() {
    try {
        console.log("🚀 Iniciando Protocolo de Inscrição Multi-User...");

        // Remover grupo antigo
        try {
            await faceClient.personGroup.deleteMethod(GROUP_ID);
            console.log("🧹 Grupo antigo removido.");
        } catch (e) {
            console.log("ℹ️ Criando novo grupo...");
        }

        // Criar grupo
        await faceClient.personGroup.create(
            GROUP_ID,
            "AVES_Authorized_Team"
        );

        // Registrar pessoas
        for (const user of peopleToRegister) {
            const photoPath = user.photo;

            if (fs.existsSync(photoPath)) {

                const person = await faceClient.personGroupPerson.create(
                    GROUP_ID,
                    user.name
                );

                const imageBuffer = fs.readFileSync(photoPath);

                await faceClient.personGroupPerson.addFaceFromStream(
                    GROUP_ID,
                    person.personId,
                    imageBuffer
                );

                console.log(`✅ ${user.name} registado.`);
            } else {
                console.log(`⚠️ Foto não encontrada: ${photoPath}`);
            }
        }

        // Treinar
        console.log("🧠 Sincronizando matriz neural...");
        await faceClient.personGroup.train(GROUP_ID);

        let status;

        while (true) {
            status = await faceClient.personGroup.getTrainingStatus(GROUP_ID);

            console.log(`📊 Status: ${status.status}...`);

            if (status.status !== "running") break;

            await new Promise(r => setTimeout(r, 1000));
        }

        console.log("\n✨ PROTOCOLO CONCLUÍDO COM SUCESSO!");

    } catch (err) {
        console.error("❌ Erro Detalhado:");
        console.log(err);
    }
}

registerAll();