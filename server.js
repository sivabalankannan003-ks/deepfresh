const express = require("express");
const cors = require("cors");

require("./database");

const Order = require("./models/Order");

const app = express();

app.use(cors());
app.use(express.json());

app.post("/api/orders", async (req,res)=>{

   const order = new Order(req.body);

   await order.save();

   res.json({
      success:true
   });

});
app.delete("/api/orders/:id", async (req,res)=>{

    await Order.findByIdAndDelete(req.params.id);

    res.json({
        success:true
    });

});
app.get("/api/orders", async(req,res)=>{

   const orders = await Order.find();

   res.json(orders);

});
app.put("/api/orders/:id", async (req, res) => {
  try {
    await Order.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true });
  } catch (err) {
    res.json({ success: false, error: err.message });
  }
});
app.use(express.json());

app.post("/api/admin/login", async (req, res) => {

  const { username, password } = req.body;

  if(username === "admin" && password === "admin123"){
    return res.json({
      success: true,
      token: "demo-token"
    });
  }

  res.json({
    success: false,
    message: "Invalid login"
  });

});

app.listen(5000,()=>{
   console.log("Server Running");
});