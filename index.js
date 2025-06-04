const express = require('express');
const cors = require('cors');
const app =express();
const port = process.env.PORT || 3000 ;

app.use(cors());
app.use(express.json());


app.get('/', (req,res) =>{
    res.send('Historical Artifacts server')
});
 app.listen(port ,()=>{
    console.log(`Historical Artifacts server on port ${port}`);
 });