let cheerio=require('cheerio');
let fs=require('fs');
let request=require('request');
let mysql=require('mysql');
const excel = require('exceljs');

var con = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "pass",
    database: "world"
  });


  let workbook=new excel.Workbook();
  let worksheet=workbook.addWorksheet('youtubersInIndia');

  worksheet.columns = [
    { header: 'Id', key: '_id', width: 10 },
    { header: 'Name', key: 'name', width: 30 },
    { header: 'Subscribers', key: 'subscribers', width: 30},
    { header: 'Views', key: 'views', width: 30, outlineLevel: 1}
];

request("https://www.socialbakers.com/statistics/youtube/channels/india?time="+Date.now(),function(err,res,body){

    if(err){
        console.log("error occured : "+err);
        }
    else{
        let name=[];
        let subscribers=[];
        let veiws=[];
        let $ = cheerio.load(body);  //loading of complete HTML body
    let i=0;
    let values=[];
        $('div.brand-table-placeholder>table.brand-table-list>tbody>tr').each(function(index){
           if(index>-1){

            $(this).find('td>div.item').each((index,elem)=>{
                if(index==1){
                    name[i]=$(elem).find('h2').text();
                    
                }
                else if(index==2){
                   
                    let temp=$(elem).text().trim().split("\n");
                    console.log(">"+temp[1].trim().split(/\s{1}/));
                
                 let temp1=temp[temp.length-1].trim().split(/\s{1}/);
                 let num=0;
                 
                    for(let x=0;x<temp1.length;x++){
                        num=num*1000+parseInt(temp1[x]);
                    }
                   
                    subscribers[i]=num;          
                    
                 
                }
                else if(index==3){
                    let temp=$(elem).find('strong').text().trim();
                    let num=0;
                    for(let x of temp.split(/\s{1}/)){
                        num=num*1000+parseInt(x);
                    }
                    
                    veiws[i]=num;
                    
                }
               
            });

           }

           if(typeof(name[i])!='undefined' && typeof(subscribers[i])!='undefined' && typeof(veiws[i])!='undefined'){
            values[i]=[name[i],subscribers[i],veiws[i]];  
            i++;
           }
                    
        });
        let arrayYoutubers;
        con.connect(function(err) {
            if (err) throw err;
            query("INSERT INTO youtubeChanels VALUES ?",[values])
            .then((rows)=>{
                console.log("2nd query!");
            return query("SELECT * FROM youtubeChanels")
            })
            .then((result)=>{
                console.log("inside 3rd then!");
                arrayYoutubers=result;
                console.log("stringified: "+JSON.stringify(arrayYoutubers));
                let jsonYoutubers=arrayYoutubers;
                worksheet.addRows(jsonYoutubers);
                
                workbook.xlsx.writeFile("IndianYoutubers.xlsx")
                        .then(function() {
                            console.log("file saved!");
                });
                con.end();
            })
            .catch((err)=>console.log("error caught: "+err));
           
          });
              
        }

});
function query( sql, args ) {
    return new Promise( ( resolve, reject ) => {
        con.query( sql, args, ( err, rows ) => {
            if ( err )
                return reject( err );
            console.log("executed > "+sql);
            resolve( rows );
        } );
    } );
}