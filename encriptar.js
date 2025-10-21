const { Usuario } = require("./models");

async function actualizarYListarPasswords() {
  try {
    const usuarios = await Usuario.findAll({ scope: "withPassword" });

    const passwordsAsignados = []; // Aquí se guardan los passwords en texto plano

    for (const usuario of usuarios) {
      if (!usuario.password) {
        const passwordDefecto = "Password123";
        usuario.password = passwordDefecto;
        await usuario.save();
        passwordsAsignados.push({ id: usuario.id, email: usuario.email, password: passwordDefecto });
        continue;
      }

      if (usuario.password.length < 60) { // password en texto plano
        const passwordPlano = usuario.password;
        usuario.password = passwordPlano;
        await usuario.save();
        passwordsAsignados.push({ id: usuario.id, email: usuario.email, password: passwordPlano });
      }
    }

    console.log("Usuarios con passwords asignados o recién encriptados:");
    console.table(passwordsAsignados);
  } catch (error) {
    console.error("Error actualizando/listando passwords:", error);
  }
}

actualizarYListarPasswords();
