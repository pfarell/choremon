const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI("DUMMY_KEY");

try {
  const model = genAI.getGenerativeModel({ model: "gemma-3-12b-it" });
  console.log("Model successfully instantiated:", model.model);
} catch (e) {
  console.error("Failed to instantiate:", e.message);
}
