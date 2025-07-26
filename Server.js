require("dotenv").config(); 
var express = require("express");
var fileuploader = require("express-fileupload");
var cloudinary = require("cloudinary").v2;
var mysql2 = require("mysql2");
var fs = require("fs");
var app = express();
app.use(fileuploader());
app.use(express.urlencoded(true));

const { GoogleGenerativeAI } = require("@google/generative-ai");
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

app.listen(3000, function () {
  console.log("Server started at port no:3000"); // to check if server is working correctly
});

app.use(express.static("public")); //When a browser requests a file (like /styles/main.css or /images/logo.png), Express will look inside the public directory (or whatever directory you specify) for that file.

app.get("/",function(req,resp){
  let path=__dirname+"/public/index.html";
  resp.sendFile(path);
})

//====================Cloudinary==================

cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET
});


//=====AIven====
let dbConfig = process.env.DB_URL;

let mySqlVen = mysql2.createConnection(dbConfig);
mySqlVen.connect(function (err) {
  if (err == null) console.log("AiVen Connected Successfulllyyy!!!!");
  else console.log(err.message);
});

app.post("/signup", function (req, resp) {
 // console.log("Hey here");
  let emailid = req.body.SignuptxtEmail;
  let pwd = req.body.SignuptxtPwd;
  let usertype = req.body.SignupinputUserType;

  //console.log(emailid);
  //console.log(pwd);
  //console.log(usertype);

mySqlVen.query(
    "insert into users values(?,?,?,current_date(),1)",
    [emailid, pwd, usertype],
    function (err) {
      if (err == null) {
        resp.send("SignUp Successfully");
      } else {
        resp.send(err);
      }
    }
  );
});

//======================= TO CHECK SERVER DATA SAVE =========================
app.get("/all", function (req, resp) {
  mySqlVen.query("select * from users", function (err, result) {
    //console.log(result);
    resp.send(result);
  });
});
//===========================================================================
app.get("/login",function(req,resp){
  let emailid=req.query.LogintxtEmail;
  let pwd=req.query.LogintxtPwd;

  mySqlVen.query("select * from users where emailid=? and pwd=?",[emailid,pwd],function(err,records)
  {
    if(err==null)
    {
      if(records.length==0)
      resp.send("Invalid");
      else if(records[0].status==1)
      {
        resp.send(records[0].usertype)
      }
      else
        resp.send("Blocked");
    }
    else
      resp.send(err.message);
  })
})

//===========================================INSERT ORGANISATION DETAIL================================================
app.post("/org-details",async function (req,resp) 
{
  let picurl="";
  if(req.files!=null)
    {
      let fName=req.files.orgDetailPic.name;
      let fullPath=__dirname+"/public/uploads/"+fName;
      req.files.orgDetailPic.mv(fullPath);

      await cloudinary.uploader.upload(fullPath).then(function(picurlresult){
        picurl=picurlresult.url;
        //console.log(picurl);
      })
    } 
    else
    picurl="NOPIC.jpg"; 

    let emailid=req.body.orgDetailtxtEmail;
    let orgname=req.body.orgDetailtxtOrgname;
    let registrationnumber=req.body.orgDetailtxtRegNo;
    let address=req.body.orgDetailtxtAddress;
    let city=req.body.orgDetailtxtCity;
    let sports=req.body.orgDetailtxtSports;
    let head=req.body.orgDetailtxtHead;
    let website=req.body.orgDetailtxtWeb;
    let instagram=req.body.orgDetailtxtInsta;
    let contact=req.body.orgDetailtxtContact;
    let bio=req.body.orgDetailtxtBio;

    //console.log(picurl);

    mySqlVen.query(
    "insert into organizers values(?,?,?,?,?,?,?,?,?,?,?,?)",
    [emailid, orgname,registrationnumber,address,city,sports,head,website,instagram,contact,picurl,bio],

    function (err) {
      if (err == null) {
        resp.send("Saved Successfully");
      } else {
        resp.send(err);
      }
    }
  )
})



//========================UPDATE ORGANISATION DETAIL============================================================
app.post("/update-org-details",async function (req,resp) 
{
  let picurl="";
  if(req.files!=null)
    {
      let fName=req.files.orgDetailPic.name;
      let fullPath=__dirname+"/public/uploads/"+fName;
      req.files.orgDetailPic.mv(fullPath);

      await cloudinary.uploader.upload(fullPath).then(function(picurlresult){
        picurl=picurlresult.url;
        //console.log(picurl);
      })
    } 
    else
    picurl=picurl=req.body.hdn;  // HOW TO MAKE IT RETAIN

    let emailid=req.body.orgDetailtxtEmail;
    let orgname=req.body.orgDetailtxtOrgname;
    let registrationnumber=req.body.orgDetailtxtRegNo;
    let address=req.body.orgDetailtxtAddress;
    let city=req.body.orgDetailtxtCity;
    let sports=req.body.orgDetailtxtSports;
    let head=req.body.orgDetailtxtHead;
    let website=req.body.orgDetailtxtWeb;
    let instagram=req.body.orgDetailtxtInsta;
    let contact=req.body.orgDetailtxtContact;
    let bio=req.body.orgDetailtxtBio;

    //console.log(picurl);

    mySqlVen.query(
    "update organizers set orgname=?,registrationnumber=?,address=?,city=?,sports=?,head=?,website=?,instagram=?,contact=?,picurl=?,bio=? where emailid=?",
    [orgname,registrationnumber,address,city,sports,head,website,instagram,contact,picurl,bio,emailid],function (err,result) 
    {
      if(err==null)
      {
          if(result.affectedRows==1)
              resp.send("Details Updated successfully");
          else
              resp.send("Check your email id");
      }
      else 
          resp.send(err.message) ;
    }
  )
})
//====================================ORGANISATION DETAILS SEARCH==================
app.get("/orgdetail-search",function(req,resp)
{
  mySqlVen.query("select * from organizers where emailid=?",[req.query.orgDetailtxtEmail],function(err,records){
    if(err==null)
    {
      if(records.length==1)
        resp.json(records);
      else
        resp.send("NO RECORD FOUND");
    }
    else
      resp.send(err.message);
  })
})
///===================================
app.get("/chk-orgdetail-email",function(req,resp)
{

  mySqlVen.query("select * from organizers where emailid=?",[req.query.orgDetailtxtEmail],function(err,records)
  {
    if(err==null)
    {
      if(records.length==0)
        {
          resp.send("Data not found");
        }
      else
      {
        resp.send("Data found");
      }
    }
    else
    resp.send(err.message);
  })
})
//================================TOURNAMENT REGISTRATION===============================
app.post("/tournament-register",function(req,resp){
  let emailid=req.body.tourDetailtxtEmail;
  let event=req.body.tourDetailtxtEventname;
  let doe=req.body.tourDetaildateTour;
  let toe=req.body.tourDetailtimeTour;
  let address=req.body.tourDetailtxtAddress;
  let city=req.body.tourDetailtxtCity;
  let sports=req.body.tourDetailSports;
  let minage=req.body.tourDetailnumMinage;
  let maxage=req.body.tourDetailnumMaxage;
  let lastdate=req.body.tourDetaildateLast;
  let lasttime=req.body.tourDetailtimeLast;
  let fee=req.body.tourDetailnumEntry;
  let prize=req.body.tourDetailnumPrize;
  let contact=req.body.tourDetailtxtContact;

  //console.log(contact);
  //console.log(emailid);

  mySqlVen.query("insert into tournaments values(null,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",[emailid,event,doe,toe,address,city,sports,minage,maxage,lastdate,lasttime,fee,prize,contact],function(err){
    if(err==null)
    {
      resp.send("Tournament created");
    }
    else
    {
      resp.send(err.message);
    }
  })
})
//=============TOURNAMENT TO ORGANISZERS=====================
app.get("/do-fetch-all-users",function(req,resp)
{
 
  let emailid=req.query.emailidKuch;
  //console.log(emailid);
  mySqlVen.query("select * from tournaments where emailid=?",[emailid],function(err,allRecords)
  {
    if(err==null)
    {
      if(allRecords.affectedRows!=0)
        resp.send(allRecords);
      else
        resp.send(err.message);
    }
  })
})
    

//=====================DELETE from tournaments lists==================
app.get("/delete-one",function(req,resp)
{
    
    //console.log(req.query)
    let rid=req.query.ridno;


    mySqlVen.query("delete from tournaments where rid=?",[rid],function(errKuch,result)
    {
        if(errKuch==null)
                {
                    if(result.affectedRows==1)
                        resp.send(" Deleted Successfulllyyyy...");
                    else
                        resp.send("No events for registered on this id");
                }
                else
                resp.send(errKuch);

    })
}) 

//======================= AI FOR DATA RETERIVAL===========
async function RajeshBansalKaChirag(imgurl)
{
const myprompt = "Read the text on picture and tell all the information in adhaar card and give output STRICTLY in JSON format {adhaar_number:'', name:'', gender:'', dob: ''}. Dont give output as string."   
    const imageResp = await fetch(imgurl)
        .then((response) => response.arrayBuffer());

    const result = await model.generateContent([
        {
            inlineData: {
                data: Buffer.from(imageResp).toString("base64"),
                mimeType: "image/jpeg",
            },
        },
        myprompt,
    ]);
    //console.log(result.response.text())
            
            const cleaned = result.response.text().replace(/```json|```/g, '').trim();
            const jsonData = JSON.parse(cleaned);
            //console.log(jsonData);

    return jsonData

}
//===========================================INSERT PLAYER DETAIL================================================
var allo="";//globaL
app.post("/player-details",async function (req,resp) 
{
  let aadharurl="";
  if(req.files!=null)
    {
      let fName1=req.files.playerDetailAadharPic.name;
      let fullPath1=__dirname+"/public/uploads/"+fName1;
      req.files.playerDetailAadharPic.mv(fullPath1);

      try{
      await cloudinary.uploader.upload(fullPath1).then(async function(picurlresult)
      {
        aadharurl=picurlresult.url;
        let jsonData=await RajeshBansalKaChirag(picurlresult.url)
        //console.log(jsonData);
        //console.log(jsonData.name);
        allo=jsonData;
        //console.log(allo);
        //console.log(allo.name);
      })
      }
      catch(err)
      {
        //console.log(err.message);
      }
    } 
    else
    picurl="No aadhar Pic"; 

    let profileurl="";
  if(req.files!=null)
    {
      let fName2=req.files.playerDetailProfilePic.name;
      let fullPath2=__dirname+"/public/uploads/"+fName2;
      req.files.playerDetailProfilePic.mv(fullPath2);


      await cloudinary.uploader.upload(fullPath2).then(function(picurlresult){
        profileurl=picurlresult.url;
        //console.log(profileurl);
      })
    } 
    else
    picurl="No Profile Pic"; 

    let emailid=req.body.playerDetailtxtEmail;
    let name=allo.name;
    let dob=allo.dob;// type da farak;
    let gender=allo.gender;
    let aadharnum=allo.adhaar_number;
    let address=req.body.playerDetailtxtAddress;
    let sports=req.body.playerDetailSports;
    let contact=req.body.playerDetailContact;
    let bio=req.body.playerDetailtxtBio;

    //console.log(emailid);
    //console.log(allo.date);
    //console.log(allo.adhhar_number);
    mySqlVen.query(
    "insert into players values(?,?,?,?,?,?,?,?,?,?,?)",
    [emailid,aadharurl,profileurl,name,dob,gender,aadharnum,address,sports,contact,bio],
    function (err) {
      if (err == null) {
        resp.send("Saved Successfully");
      } else {
        resp.send(err);
      }
    }
  )
})
//====Player =======================
app.get("/chk-playerdetail-email",function(req,resp)
{

  mySqlVen.query("select * from players where emailid=?",[req.query.playerDetailtxtEmail],function(err,records)
  {
    if(err==null)
    {
      if(records.length==0)
        {
          resp.send("Data found");
        }
      else
      {
        resp.send("No data found");
      }
    }
    else
    resp.send(err.message);
  })
})
//=========================TO FILL DATA FOR A PARTICULAR EMAILID IN PLAYER DATA==========================
app.get("/playerdetail-search",function(req,resp)
{
  mySqlVen.query("select * from players where emailid=?",[req.query.playerDetailtxtEmail],function(err,records)
  {
    
    if(err==null)
    {
      if(records.length==1)
        resp.json(records);
      else
        resp.send("NO RECORD FOUND");
    }
    else
      resp.send(err.message);
  })
})
//============================UPDATE THE PLAYER DETAIL===========================


//=============================GETIING ON USER CONSOLE=================

app.get("/do-fetch-all-users2",function(req,resp)
{
        mySqlVen.query("select * from users",function(err,allRecords)
        {
                    resp.send(allRecords);
        })
})

//==================================BLOCK USER===========
app.get("/block-user",function(req,resp)
{
    let emailid=req.query.email;

    mySqlVen.query("update users set status=? where emailid=? ",['0',emailid],function(errKuch,result)
    {
        if(errKuch==null)
                {
                    if(result.affectedRows==1)
                        resp.send(emailid+" User blocked");
                    else
                        resp.send("Invalid Email id");
                }
                else
                resp.send(errKuch);

    })
})
//===========================UNBLOCK USER===========
app.get("/unblock-user",function(req,resp)
{
    let emailid=req.query.email;

    mySqlVen.query("update users set status=? where emailid=? ",['1',emailid],function(errKuch,result)
    {
        if(errKuch==null)
                {
                    if(result.affectedRows==1)
                        resp.send(emailid+" User blocked");
                    else
                        resp.send("Invalid Email id");
                }
                else
                resp.send(errKuch);

    })
})
//====================TOURNAMENT SHOWING TO PLAYERS===========
app.get("/do-fetch-all-users-players",function(req,resp)
{
  //console.log(req.query);
        mySqlVen.query("select * from tournaments where city=? and sports=? ",[req.query.kuchCity,req.query.kuchGame],function(err,allRecords)
        {
                    resp.send(allRecords);
        })
})
//==============================FETCHING CITIES FOR PLAYERS====================
app.get("/do-fetch-all-cities",function(req,resp)
{
        mySqlVen.query("select distinct city from tournaments",function(err,allRecords)
        {
                    resp.send(allRecords);
        })
})
//============================SETTING IN PLAYER DASH===============
app.get("/do-update",function(req,resp)
{
  //console.log(req.query);
        mySqlVen.query("update users set pwd=? where emailid=? and pwd=? ",[req.query.kuchnewpwd,req.query.kuchemail,req.query.kucholdpwd],function(err,allRecords)
        {
          if(err==null)
          resp.send(allRecords);
          else
          resp.send(err.message);
        })
})
//========================ORGANIZERS IN ADMIN================
app.get("/do-fetch-all-users-organizers",function(req,resp)
{
        mySqlVen.query("select * from organizers",function(err,allRecords)
        {
                    resp.send(allRecords);
        })
})
//========================PLAYERS IN ADMIN================
app.get("/do-fetch-all-users-participants",function(req,resp)
{
        mySqlVen.query("select * from players",function(err,allRecords)
        {
                    resp.send(allRecords);
        })
})
