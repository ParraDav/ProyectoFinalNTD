const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const Usuario = require("./models/Usuario");
const Curso = require("./models/curso");
const Inscripcion = require("./models/Inscripcion");

async function seedDatabase() {
    try {
        const countUsers = await Usuario.countDocuments();
        if (countUsers > 0) {
            console.log("La base de datos ya contiene información. Omitiendo siembra.");
            return;
        }

        console.log("Sembrando base de datos local con usuarios y cursos de prueba...");

        const passHash = await bcrypt.hash("123456", 10);

        // 1. Crear Usuarios de Prueba
        const admin = new Usuario({
            nombre: "Admin Skillia",
            email: "admin@skillia.com",
            password: passHash,
            rol: "administrador"
        });
        await admin.save();

        const instructorStiven = new Usuario({
            nombre: "Stiven Instructor",
            email: "stiven@gmail.com",
            password: passHash,
            rol: "instructor"
        });
        await instructorStiven.save();

        const instructorDavid = new Usuario({
            nombre: "David Instructor",
            email: "dinstructor@gmail.com",
            password: passHash,
            rol: "instructor"
        });
        await instructorDavid.save();

        const estudianteJuan = new Usuario({
            nombre: "Juan Estudiante",
            email: "juan@test.com",
            password: passHash,
            rol: "estudiante"
        });
        await estudianteJuan.save();

        console.log("✔ Usuarios de prueba creados.");

        // 2. Crear Cursos de Prueba
        const cursoAngular = new Curso({
            nombre: "Curso de Angular Pro",
            descripcion: "Domina Angular, Directivas, RxJS, Signals y Standalone Components desde cero.",
            estado: "publicado",
            instructor: instructorStiven._id,
            modulos: [
                { titulo: "Módulo 1: Introducción a Angular", contenido: "Historia, arquitectura básica y primer componente." },
                { titulo: "Módulo 2: Standalone Components", contenido: "Cómo trabajar sin NgModules de forma moderna." },
                { titulo: "Módulo 3: Directivas y Pipes", contenido: "Uso de directivas estructurales y pipes personalizados." }
            ]
        });
        await cursoAngular.save();

        const cursoNode = new Curso({
            nombre: "Desarrollo con Node.js",
            descripcion: "Construye APIs REST rápidas y escalables utilizando Express y MongoDB.",
            estado: "publicado",
            instructor: instructorDavid._id,
            modulos: [
                { titulo: "Módulo 1: Fundamentos de Node.js", contenido: "Event Loop, sistema de archivos y módulos HTTP nativos." },
                { titulo: "Módulo 2: Introducción a Express", contenido: "Routing, middlewares y controladores base." }
            ]
        });
        await cursoNode.save();

        const cursoMongoose = new Curso({
            nombre: "Introducción a Mongoose (Borrador)",
            descripcion: "Aprende a modelar tus datos de MongoDB usando Schemas y validaciones nativas de Mongoose.",
            estado: "borrador",
            instructor: instructorStiven._id,
            modulos: [
                { titulo: "Módulo 1: Schemas y Tipos", contenido: "Creación de esquemas y tipos de datos admitidos." }
            ]
        });
        await cursoMongoose.save();

        console.log("✔ Cursos de prueba creados.");

        // 3. Crear Inscripciones (para probar avances y certificados)
        // Juan está inscrito en Angular Pro y completó el 100% de los módulos (listo para solicitar certificado)
        const inscripcionAngular = new Inscripcion({
            estudiante: estudianteJuan._id,
            curso: cursoAngular._id,
            modulosCompletados: [
                cursoAngular.modulos[0]._id.toString(),
                cursoAngular.modulos[1]._id.toString(),
                cursoAngular.modulos[2]._id.toString()
            ],
            estadoCertificado: "no_solicitado"
        });
        await inscripcionAngular.save();

        // Juan está inscrito en Node.js y completó el 50%
        const inscripcionNode = new Inscripcion({
            estudiante: estudianteJuan._id,
            curso: cursoNode._id,
            modulosCompletados: [
                cursoNode.modulos[0]._id.toString()
            ],
            estadoCertificado: "no_solicitado"
        });
        await inscripcionNode.save();

        console.log("✔ Inscripciones y progresos sembrados.");
        console.log("🎉 Siembra de base de datos finalizada correctamente.");
    } catch (error) {
        console.error("❌ Error al sembrar la base de datos:", error);
    }
}

async function connectDB() {
    try {
        console.log("Conectando a MongoDB Atlas...");
        // Intentar conectar a MongoDB Atlas con timeout de 5 segundos
        await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 5000 });
        console.log("Conectado con éxito a MongoDB Atlas.");
    } catch (atlasError) {
        console.error("No se pudo conectar a MongoDB Atlas (Error de autenticación o de red).");
        console.warn("Iniciando base de datos en memoria local (mongodb-memory-server)...");
        
        try {
            const { MongoMemoryServer } = require("mongodb-memory-server");
            const mongoServer = await MongoMemoryServer.create();
            const memoryUri = mongoServer.getUri();
            
            console.log(`Conectando a la base de datos en memoria: ${memoryUri}`);
            await mongoose.connect(memoryUri, { dbName: "proyectoFinal" });
            console.log("Conectado con éxito a la base de datos en memoria.");
            
            // Sembrar la base de datos en memoria con datos por defecto
            await seedDatabase();
        } catch (memoryError) {
            console.error("Error crítico: No se pudo iniciar la base de datos en memoria.", memoryError);
            throw memoryError;
        }
    }
}

module.exports = connectDB;
