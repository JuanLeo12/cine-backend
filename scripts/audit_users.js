/*
  Audit script for usuarios: reports users missing required fields per role.
  Usage:
    node scripts/audit_users.js         # just report
    UPDATE=1 node scripts/audit_users.js  # report + fill placeholders (use with caution)

  Placeholder fill behaviour (only when UPDATE=1):
    - cliente: missing apellido -> 'SinApellido', telefono -> '0000000', direccion -> 'Sin dirección', fecha_nacimiento -> '1970-01-01', genero -> 'otro'
    - corporativo: missing representante -> 'SinRepresentante', cargo -> 'SinCargo', ruc -> '00000000000'
    - admin: missing nombre/email/password will be reported but NOT auto-filled for safety

  Note: Run from project root. The script uses the project's Sequelize setup and Usuario model.
*/

const path = require('path');
const Sequelize = require('sequelize');

(async () => {
  try {
    const root = path.resolve(__dirname, '..');
    // Ensure project modules can be required
    const db = require(path.join(root, 'config', 'db'));
    const Usuario = require(path.join(root, 'models', 'usuario'));

    const update = !!process.env.UPDATE;

    console.log('Audit usuarios - reporting missing required fields per role');
    console.log('Update placeholders:', update ? 'ENABLED' : 'disabled (set UPDATE=1 to enable)');

    const usuarios = await Usuario.scope('withPassword').findAll({});

    const report = [];

    for (const u of usuarios) {
      const user = u.get({ plain: true });
      const missing = [];
      if (user.rol === 'cliente') {
        if (!user.nombre) missing.push('nombre');
        if (!user.apellido) missing.push('apellido');
        if (!user.telefono) missing.push('telefono');
        if (!user.direccion) missing.push('direccion');
        if (!user.fecha_nacimiento) missing.push('fecha_nacimiento');
        if (!user.genero) missing.push('genero');
        if (!user.email) missing.push('email');
        if (!user.password) missing.push('password');
        if (!user.dni) missing.push('dni');
      } else if (user.rol === 'corporativo') {
        if (!user.nombre) missing.push('nombre');
        if (!user.telefono) missing.push('telefono');
        if (!user.direccion) missing.push('direccion');
        if (!user.email) missing.push('email');
        if (!user.password) missing.push('password');
        if (!user.ruc) missing.push('ruc');
        if (!user.representante) missing.push('representante');
        if (!user.cargo) missing.push('cargo');
      } else if (user.rol === 'admin') {
        if (!user.nombre) missing.push('nombre');
        if (!user.email) missing.push('email');
        if (!user.password) missing.push('password');
      }

      if (missing.length) {
        report.push({ id: user.id, email: user.email, rol: user.rol, missing });

        if (update) {
          const updates = {};
          if (user.rol === 'cliente') {
            if (!user.apellido) updates.apellido = 'SinApellido';
            if (!user.telefono) updates.telefono = '0000000';
            if (!user.direccion) updates.direccion = 'Sin dirección';
            if (!user.fecha_nacimiento) updates.fecha_nacimiento = '1970-01-01';
            if (!user.genero) updates.genero = 'otro';
            if (!user.dni) updates.dni = null; // we don't invent DNI
          } else if (user.rol === 'corporativo') {
            if (!user.representante) updates.representante = 'SinRepresentante';
            if (!user.cargo) updates.cargo = 'SinCargo';
            if (!user.ruc) updates.ruc = '00000000000';
          }

          if (Object.keys(updates).length) {
            await Usuario.update(updates, { where: { id: user.id } });
            console.log(`Updated placeholders for user id=${user.id} (${user.email})`);
          } else {
            console.log(`No safe placeholders defined for user id=${user.id} (${user.email})`);
          }
        }
      }
    }

    if (!report.length) {
      console.log('All users contain required fields per their roles.');
    } else {
      console.log('Users with missing fields:');
      for (const r of report) {
        console.log(` - id=${r.id} email=${r.email} rol=${r.rol} missing=${r.missing.join(', ')}`);
      }
      console.log('\nTotal:', report.length);
    }

    process.exit(0);
  } catch (err) {
    console.error('Error running audit:', err);
    process.exit(2);
  }
})();
