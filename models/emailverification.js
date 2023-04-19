const mongoose = require("mongoose");
const bcrypt = require('bcrypt');


const EmailverificationcodeSchema = mongoose.Schema({
    owner : {
        type:mongoose.Schema.ObjectId,
        require:true,
        ref:"User"
    },
    token:{
        type:String
    },
    created:{
        type:Date,
        expires:3600,
        default:Date.now()
    }
});


EmailverificationcodeSchema.pre('save', async function (next){
    if(this.isModified("token")){
        this.token =await bcrypt.hash(this.token ,10)
    }
    next();
})


EmailverificationcodeSchema.methods.compaireToken = async function (token) {
    const result = await bcrypt.compare(token, this.token);
    return result;
  };
module.exports =  mongoose.model('Emailverification',EmailverificationcodeSchema);
