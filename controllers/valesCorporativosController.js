const { ValeCorporativo, Pago, OrdenCompra } = require("../models");
const { validarVale } = require("../utils/validacionesValesCorporativos");

// 👇 Incluyendo con alias
const valeInclude = [
  { model: Pago, as: "pago", attributes: ["id", "monto_total", "estado_pago"] },
  {
    model: OrdenCompra,
    as: "ordenCompra",
    attributes: ["id", "fecha_compra", "id_usuario"],
  },
];

// 📌 Listar vales
exports.listarVales = async (req, res) => {
  try {
    const where = {};
    if (req.user.rol !== "admin") {
      where["$ordenCompra.id_usuario$"] = req.user.id;
    }

    const vales = await ValeCorporativo.findAll({
      where,
      include: valeInclude,
    });
    res.json(vales);
  } catch (error) {
    console.error("Error listarVales:", error);
    res.status(500).json({ error: "Error al obtener vales corporativos" });
  }
};

// 📌 Crear vale
exports.crearVale = async (req, res) => {
  try {
    const { codigo, tipo, valor, fecha_expiracion, id_pago, id_orden_compra } =
      req.body;

    const errores = validarVale({ codigo, tipo, valor, fecha_expiracion });
    if (errores.length > 0) return res.status(400).json({ errores });

    const existe = await ValeCorporativo.findOne({ where: { codigo } });
    if (existe) return res.status(409).json({ error: "El código ya existe" });

    if (id_pago) {
      const pago = await Pago.findByPk(id_pago, {
        include: [
          { model: OrdenCompra, as: "ordenCompra", attributes: ["id_usuario"] },
        ],
      });
      if (!pago) return res.status(404).json({ error: "Pago no encontrado" });

      if (
        req.user.rol !== "admin" &&
        pago.ordenCompra?.id_usuario !== req.user.id
      ) {
        return res.status(403).json({
          error: "No puedes asociar un vale a un pago que no es tuyo",
        });
      }
    }

    if (id_orden_compra) {
      const orden = await OrdenCompra.findByPk(id_orden_compra);
      if (!orden)
        return res.status(404).json({ error: "Orden de compra no encontrada" });

      if (req.user.rol !== "admin" && orden.id_usuario !== req.user.id) {
        return res.status(403).json({
          error: "No puedes asociar un vale a una orden que no es tuya",
        });
      }
    }

    const nuevo = await ValeCorporativo.create({
      codigo,
      tipo,
      valor,
      fecha_expiracion,
      usado: false,
      id_pago: id_pago || null,
      id_orden_compra: id_orden_compra || null,
    });

    res
      .status(201)
      .json({ mensaje: "Vale corporativo creado con éxito", vale: nuevo });
  } catch (error) {
    console.error("Error crearVale:", error);
    res.status(500).json({ error: "Error al crear vale corporativo" });
  }
};

// 📌 Obtener vale por ID
exports.obtenerVale = async (req, res) => {
  try {
    const vale = await ValeCorporativo.findByPk(req.params.id, {
      include: valeInclude,
    });

    if (!vale) return res.status(404).json({ error: "Vale no encontrado" });

    // Verificar permisos (admin ve todos, corporativo solo los suyos)
    if (
      req.user.rol !== "admin" &&
      vale.ordenCompra?.id_usuario !== req.user.id
    ) {
      return res
        .status(403)
        .json({ error: "No tienes permiso para ver este vale" });
    }

    res.json(vale);
  } catch (error) {
    console.error("Error obtenerVale:", error);
    res.status(500).json({ error: "Error al obtener vale" });
  }
};

// 📌 Actualizar vale (marcar como usado)
exports.actualizarVale = async (req, res) => {
  try {
    const vale = await ValeCorporativo.findByPk(req.params.id, {
      include: [
        { model: OrdenCompra, as: "ordenCompra", attributes: ["id_usuario"] },
      ],
    });
    if (!vale) return res.status(404).json({ error: "Vale no encontrado" });

    // Permitir actualizar (marcar como usado) si:
    // - es admin
    // - o el vale está asociado a una orden del propio usuario
    // - o el vale no está asociado a ninguna orden (se permite que el usuario que validó lo marque usado)
    if (req.user.rol !== "admin") {
      if (vale.ordenCompra && vale.ordenCompra.id_usuario !== req.user.id) {
        return res
          .status(403)
          .json({ error: "No tienes permiso para actualizar este vale" });
      }
    }

    await vale.update({ usado: true });

    res.json({
      mensaje: "Vale actualizado correctamente",
      vale: { ...vale.toJSON(), estado: "usado" },
    });
  } catch (error) {
    console.error("Error actualizarVale:", error);
    res.status(500).json({ error: "Error al actualizar vale" });
  }
};

// 📌 Eliminar vale
exports.eliminarVale = async (req, res) => {
  try {
    const vale = await ValeCorporativo.findByPk(req.params.id, {
      include: [
        { model: OrdenCompra, as: "ordenCompra", attributes: ["id_usuario"] },
      ],
    });
    if (!vale) return res.status(404).json({ error: "Vale no encontrado" });

    if (
      req.user.rol !== "admin" &&
      vale.ordenCompra?.id_usuario !== req.user.id
    ) {
      return res
        .status(403)
        .json({ error: "No tienes permiso para eliminar este vale" });
    }

    if (vale.usado) {
      return res
        .status(400)
        .json({ error: "No se puede eliminar un vale ya usado" });
    }

    await vale.destroy();
    res.json({ mensaje: "Vale corporativo eliminado correctamente" });
  } catch (error) {
    console.error("Error eliminarVale:", error);
    res.status(500).json({ error: "Error al eliminar vale corporativo" });
  }
};

// 📌 Validar vale para compra
exports.validarValeCodigo = async (req, res) => {
  try {
    const { codigo } = req.params;

    const vale = await ValeCorporativo.findOne({ 
      where: { codigo }
    });

    if (!vale) {
      return res.status(404).json({ 
        valido: false, 
        error: 'Código de vale no encontrado' 
      });
    }

    // Verificar si ya fue usado
    if (vale.usado) {
      return res.status(400).json({ 
        valido: false, 
        error: 'Este vale ya fue utilizado' 
      });
    }

    // Verificar fecha de expiración
    const ahora = new Date();
    const fechaExpiracion = new Date(vale.fecha_expiracion);
    if (fechaExpiracion < ahora) {
      return res.status(400).json({ 
        valido: false, 
        error: 'Este vale ha expirado' 
      });
    }

    res.json({
      valido: true,
      vale: {
        id: vale.id,
        codigo: vale.codigo,
        tipo: vale.tipo,
        valor: vale.valor,
        fecha_expiracion: vale.fecha_expiracion
      },
      mensaje: `Vale válido: S/ ${vale.valor} de descuento en ${vale.tipo === 'entrada' ? 'entradas' : 'combos'}`
    });

  } catch (error) {
    console.error('Error validarValeCodigo:', error);
    res.status(500).json({ error: 'Error al validar vale' });
  }
};
