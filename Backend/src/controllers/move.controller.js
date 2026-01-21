const Move = require("../models/move.model");

// POST /api/moves
const createMove = async (req, res) => {
  try {
    const { pickup, dropoff, moveDate, service, price } = req.body;

    // Basic validation
    if (!pickup || !dropoff || !moveDate || !service || !price) {
      return res.status(400).json({ message: "Please enter all required fields" });
    }

    const newMove = new Move({
      user: req.user.id,
      pickup,
      dropoff,
      moveDate,
      service,
      price,
    });

    const savedMove = await newMove.save();
    res.status(201).json(savedMove);
  } catch (error) {
    console.error("Error creating move:", error);
    res.status(500).json({ message: "Failed to create move" });
  }
};

const getMyMoves = async (req, res) => {
  try {
    const moves = await Move.find({ user: req.user.id })
      .sort({ createdAt: -1 });

    res.json(moves);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch moves" });
  }
};


const getAvailableMoves = async (req, res) => {
  try {
    const moves = await Move.find({
      status: "requested",
      provider: null,
    }).sort({ createdAt: -1 });

    res.json(moves);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch available moves" });
  }
};


const acceptMove = async (req, res) => {
  try {
    const move = await Move.findById(req.params.id);

    if (!move) {
      return res.status(404).json({ message: "Move not found" });
    }

    if (move.status !== "requested" || move.provider) {
      return res
        .status(400)
        .json({ message: "This move cannot be accepted" });
    }

    move.status = "accepted";
    move.provider = req.user.id;

    await move.save();

    res.json(move);
  } catch (error) {
    res.status(500).json({ message: "Failed to accept move" });
  }
};

module.exports = {
  createMove,
  getMyMoves,
  getAvailableMoves,
  acceptMove,
};