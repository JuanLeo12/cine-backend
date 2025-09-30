const { TarifaCorporativa, Usuario, TipoUsuario } = require("../models");
const { validarTarifa } = require("../utils/validacionesTarifas");

const tarifaInclude = [
  { model: Usuario, attributes: ["id", "nombre", "email"] },
  { model: TipoUsuario, attributes: ["id", "nombre"] },
];

// 📌 Listar tarifas (admin ve todas, corporativo solo las suyas)
exports.listarTarifas = async (req, res) => {
  try {
    const where = {};
    if (req.user.rol !== "admin") where.id_cliente_corporativo = req.user.id;

    const tarifas = await TarifaCorporativa.findAll({
      where,
      attributes: ["id", "id_cliente_corporativo", "id_tipo_usuario", "precio"],
      include: tarifaInclude,
    });

    res.json(tarifas);
  } catch (error) {
    console.error("Error listarTarifas:", error);
    res.status(500).json({ error: "Error al obtener tarifas corporativas" });
  }
};

// 📌 Crear tarifa
exports.crearTarifa = async (req, res) => {
  try {
    const { id_cliente_corporativo, id_tipo_usuario, precio } = req.body;

    const errores = validarTarifa({
      id_cliente_corporativo,
      id_tipo_usuario,
      precio,
    });
    if (errores.length > 0) return res.status(400).json({ errores });

    // Validar permisos
    if (req.user.rol !== "admin" && req.user.id !== id_cliente_corporativo) {
      return res
        .status(403)
        .json({
          error: "No puedes crear tarifas para otro cliente corporativo",
        });
    }

    // Validar existencia de cliente
    const cliente = await Usuario.findByPk(id_cliente_corporativo);
    if (!cliente)
      return res
        .status(404)
        .json({ error: "Cliente corporativo no encontrado" });

    // Validar existencia de tipo de usuario
    const tipo = await TipoUsuario.findByPk(id_tipo_usuario);
    if (!tipo)
      return res.status(404).json({ error: "Tipo de usuario no encontrado" });

    // Evitar duplicados
    const existe = await TarifaCorporativa.findOne({
      where: { id_cliente_corporativo, id_tipo_usuario },
    });
    if (existe) {
      return res
        .status(409)
        .json({
          error: "Ya existe una tarifa para este cliente y tipo de usuario",
        });
    }

    const nueva = await TarifaCorporativa.create({
      id_cliente_corporativo,
      id_tipo_usuario,
      precio,
    });

    res.status(201).json({ mensaje: "Tarifa creada con éxito", tarifa: nueva });
  } catch (error) {
    console.error("Error crearTarifa:", error);
    res.status(500).json({ error: "Error al registrar tarifa corporativa" });
  }
};

// 📌 Eliminar tarifa
exports.eliminarTarifa = async (req, res) => {
  try {
    const tarifa = await TarifaCorporativa.findByPk(req.params.id);
    if (!tarifa) return res.status(404).json({ error: "Tarifa no encontrada" });

    if (
      req.user.rol !== "admin" &&
      tarifa.id_cliente_corporativo !== req.user.id
    ) {
      return res
        .status(403)
        .json({ error: "No tienes permiso para eliminar esta tarifa" });
    }

    await tarifa.destroy();
    res.json({ mensaje: "Tarifa corporativa eliminada correctamente" });
  } catch (error) {
    console.error("Error eliminarTarifa:", error);
    res.status(500).json({ error: "Error al eliminar tarifa corporativa" });
  }
};
