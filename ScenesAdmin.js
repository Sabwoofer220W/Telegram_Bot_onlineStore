const { Telegraf, session, Markup } = require('telegraf');
const {Scenes} = require('telegraf');
require('dotenv').config();
const ADMIN1PASS = process.env.ADMIN1PASS;
const axios = require('axios');
const fs = require('fs');
const https = require('https');
const mongodb = require('mongodb');
const ObjectId = require('mongodb').ObjectID;
const mongoClient = new mongodb.MongoClient('MongoPass', {
                  useUnifiedTopology: true
});


class SceneGeneratorAdmin{
//=========================================================================

//=========================================================================
    Authentication(){
    const Aut = new Scenes.BaseScene('Aut');
    Aut.enter(async (ctx) => {await ctx.replyWithHTML(
`
Здравствуйте администратор ${ctx.update.message.from.first_name}
<i>Введите код доступа в панель администратора:</i>
`

)

//каждую 5 минут проверка на новые заказы
/*let Timeinterval = setInterval( () => {
  mongoClient.connect(async function(error, mongo) {
    if (!error) {
        try{
          let db = mongo.db('NurmotorsAutopart');// подключение к бд
          let orders = db.collection('Orders');//подключение коллеуции
          let colOrder = await orders.count({condition:"created"});//Кол-во ордеров
          if(colOrder > 0){
            await ctx.replyWithHTML(`Появился новый заказ! Всего заявок ${colOrder}. Используйте команду /SpareOrders`);
            console.log(`Появился новый заказ!`);
          }

            }catch (err) {console.log(err);}
          }else {console.error(err);}
})
}, 600000);*/
});



Aut.on('text', async (ctx) => {
ctx.session.AdminPass = ctx.message.text;
if (ctx.session.AdminPass == ADMIN1PASS){
   await ctx.scene.enter('adminPanel');
} else {
    await ctx.replyWithHTML('Код введен не верно! Попробуйте еще раз.');
    ctx.scene.reenter();
}
});

    return Aut
    }
//=========================================================================
//=========================================================================
    AdminPanel(){
    const adminPanel = new Scenes.BaseScene('adminPanel');
    adminPanel.enter(async (ctx) => {
        await ctx.replyWithHTML(`
<i>Ожидайте запросов пользователей</i>, либо воспользуйтесь командой
/orders - <b>Получить список не обработанных заявок;</b>
/deferred - <b>Получить список отложенных обращений;</b>
/AddAutoPart - <b>Добавить товар на сайт;</b>
/DeleteAutoPart - <b>Удалить товар на сайте;</b>
/ChangeAutoPart - <b>Изменить данный товара;</b>
/FindAProduct - <b>Найти товар по артикулу;</b>
/SpareOrders - <b>Получить список заказов на сайте;</b>
/SpareOrdersDeferred - <b>Получить список отложенных заказов на сайте;</b>
/memo - <b>Получить памятку с названиями брендов</b>
`
        )

    });
//==============================================================================
      adminPanel.command('/orders', async (ctx) => {
//----------------------------------------------------------------------------------------------------------------------
            var connectMongoDB = function () {
                mongoClient.connect(async function(error, mongo) {
                  if (!error) {
                      try{
                   // console.log('connection is mongodb');
                        var db = mongo.db('TgNormotors');// подключение к бд
                        var clients = db.collection('clients');//подключение коллеуции
                        var colOrder = await clients.count({pedido:false});//Кол-во ордеров
                        if(colOrder != 0){
                        var OneOrders = await clients.findOne({pedido:false});//Получение первого эл

                        var TextAdminOrder =
`
<i>Необработанных заявок осталось: ${colOrder}</i>;

<i>id пользователя:</i> ${OneOrders._id};
<i>Дата:</i> ${OneOrders.order[0].time};
<i>Имя:</i> ${OneOrders.order[0].name};
<i>Имя в телеграм:</i> ${OneOrders.name};
<i>Способ связи:</i> ${OneOrders.order[0].connection};
<i>Ссылка на телеграм:</i> ${OneOrders.TgName};

<b>Текст:</b> ${OneOrders.order[0].text};
`

await ctx.replyWithHTML(TextAdminOrder,Markup.inlineKeyboard(
    [
      [Markup.button.callback('🔴Ошибка запроса','But1'),Markup.button.callback('🟢Подтвердить обработатку','But2')],
      [Markup.button.callback('🟡Отложить -->','But3')]
    ]
  ));

} else {await ctx.replyWithHTML(`
На данный момент <b>нет</b> необработанных обращений.
<i>Для просмотра отложенных обращений, используйте команду</i> /deferred.
`)
}
}catch (err) {console.log(err);}
                  } else {console.error(err);}
                });
                }
//----------------------------------------------------------------------------------------------------------------------
                  adminPanel.action('But1', async (ctx) => {
                    try{
                        await ctx.replyWithHTML('Опишите ошибку запроса: ')
                        adminPanel.on('text', async (ctx) => {
                        ctx.session.ErrorMes = ctx.message.text;
                        mongoClient.connect(async function(error, mongo) {
                            if (!error) {
                                var db2 = await mongo.db('TgNormotors');// подключение к бд
                                var clients2 = await db2.collection('clients');//подключение коллеуции
                                await clients2.updateOne({"pedido":false}, {"$set": {"order.0.AdminError": ctx.session.ErrorMes,"pedido":true,"order.0.status":"Error"}});
                                connectMongoDB();
                            }else {console.error(err);}
                        });
                        });
                    }catch (err) {console.log(err);}

                });
                adminPanel.action('But2', async (ctx) => {
                    try{
                        mongoClient.connect(async function(error, mongo) {
                            if (!error) {
                                var db3 = await mongo.db('TgNormotors');// подключение к бд
                                var clients3 = await db3.collection('clients');//подключение коллеуции
                                await clients3.updateOne({"pedido":false}, {"$set": {"order.0.status":"done","pedido":true}});
                                ctx.telegram.deleteMessage(ctx.chat.id,ctx.update.callback_query.message.message_id)
                                connectMongoDB();
                            }else {console.error(err);}
                        });

                    }catch (err) {console.log(err);}
                });
                adminPanel.action('But3', async (ctx) => {
                    try{
                        mongoClient.connect(async function(error, mongo) {
                            if (!error) {
                                var db4 = await mongo.db('TgNormotors');// подключение к бд
                                var clients4 = await db4.collection('clients');//подключение коллеуции
                                await clients4.updateOne({"pedido":false}, {"$set": {"pedido":true,"order.0.status":"postponed"}});
                                ctx.telegram.deleteMessage(ctx.chat.id,ctx.update.callback_query.message.message_id)
                                connectMongoDB();
                            }else {console.error(err);}
                        });

                    }catch (err) {console.log(err);}
                });
//----------------------------------------------------------------------------------------------------------------------
                connectMongoDB();
        });

        adminPanel.command('/deferred', async (ctx) => {
            var connectMongoDB2 = function () {
                mongoClient.connect(async function(error, mongo) {
                  if (!error) {
                      try{
                        var db = mongo.db('TgNormotors');// подключение к бд
                        var clients = db.collection('clients');//подключение коллеуции
                        var colOrder = await clients.count({"order.0.status":"postponed"});//Кол-во ордеров
                        if(colOrder != 0){
                        var OneOrders = await clients.findOne({"order.0.status":"postponed"});//Получение первого эл

                        var TextAdminOrder =
`
<i>Отложенных заявок осталось: ${colOrder}</i>;

<i>id пользователя:</i> ${OneOrders._id};
<i>Дата:</i> ${OneOrders.order[0].time};
<i>Имя:</i> ${OneOrders.order[0].name};
<i>Имя в телеграм:</i> ${OneOrders.name};
<i>Способ связи:</i> ${OneOrders.order[0].connection};
<i>Ссылка на телеграм:</i> ${OneOrders.TgName};

<b>Текст:</b> ${OneOrders.order[0].text};
`

await ctx.replyWithHTML(TextAdminOrder,Markup.inlineKeyboard(
    [
      [Markup.button.callback('🔴Ошибка запроса','But4'),Markup.button.callback('🟢Подтвердить обработатку','But5')],
      [Markup.button.callback('🟡Отложить -->','But6')]
    ]
  ));
                        } else {await ctx.replyWithHTML(`
На данный момент <b>нет</b> необработанных отложенных обращений.
`)}
}catch (err) {console.log(err);}
                  } else {console.error(err);}
                });
                }
                adminPanel.action('But4', async (ctx) => {
                    try{
                        await ctx.replyWithHTML('Опишите ошибку запроса: ')
                        adminPanel.on('text', async (ctx) => {
                        ctx.session.ErrorMes = ctx.message.text;
                        mongoClient.connect(async function(error, mongo) {
                            if (!error) {
                                var db2 = await mongo.db('TgNormotors');// подключение к бд
                                var clients2 = await db2.collection('clients');//подключение коллеуции
                                await clients2.updateOne({"order.0.status":"postponed"}, {"$set": {"order.0.AdminError": ctx.session.ErrorMes,"pedido":true,"order.0.status":"Error"}});
                                connectMongoDB2();
                            }else {console.error(err);}
                        });
                        });
                    }catch (err) {console.log(err);}

                });
                adminPanel.action('But5', async (ctx) => {
                    try{
                        mongoClient.connect(async function(error, mongo) {
                            if (!error) {
                                var db3 = await mongo.db('TgNormotors');// подключение к бд
                                var clients3 = await db3.collection('clients');//подключение коллеуции
                                await clients3.updateOne({"order.0.status":"postponed"}, {"$set": {"order.0.status":"done","pedido":true}});
                                ctx.telegram.deleteMessage(ctx.chat.id,ctx.update.callback_query.message.message_id)
                                connectMongoDB2();
                            }else {console.error(err);}
                        });

                    }catch (err) {console.log(err);}
                });
                adminPanel.action('But6', async (ctx) => {
                    try{
                        mongoClient.connect(async function(error, mongo) {
                            if (!error) {
                                var db4 = await mongo.db('TgNormotors');// подключение к бд
                                var clients4 = await db4.collection('clients');//подключение коллеуции
                                await clients4.updateOne({"order.0.status":"postponed"}, {"$set": {"pedido":true,"order.0.status":"postponed"}});
                                ctx.telegram.deleteMessage(ctx.chat.id,ctx.update.callback_query.message.message_id)
                                connectMongoDB2();
                            }else {console.error(err);}
                        });

                    }catch (err) {console.log(err);}
                });
                connectMongoDB2();
        })

//===================================================================================================
adminPanel.command('/AddAutoPart', async (ctx) => {

await ctx.scene.enter('AutoPart');

});
//===================================================================================================
adminPanel.command('/DeleteAutoPart', async (ctx) => {
await ctx.scene.enter('DeletePart');
});
//===================================================================================================
adminPanel.command('/ChangeAutoPart', async (ctx) => {
await ctx.scene.enter('ChangePart');
});
//==================================================================================================
adminPanel.command('/FindAProduct', async (ctx) => {
await ctx.scene.enter('FindProduct');
});
//==================================================================================================
adminPanel.command('/memo', async (ctx) => {
  try{
    ctx.telegram.sendDocument(ctx.from.id, {
      source: './Memo.txt',
      filename: 'Memo.txt'
  });
   }catch (err) {console.log(err);}
});
//==================================================================================================
adminPanel.command('/SpareOrders', async (ctx) => {
  var connectMongoDB3 = function () {
      mongoClient.connect(async function(error, mongo) {
        if (!error) {
            try{
              var db = mongo.db('NurmotorsAutopart');// подключение к бд
              var Orders = db.collection('Orders');//подключение коллеуции
              var autoPartsChara = db.collection('autoPartsChara');
              var colOrders = await Orders.count({condition:'created'});//Кол-во ордеров
              if(colOrders != 0){
              var OneOrders = await Orders.findOne({condition:'created'});//Получение первого эл
              var orderId = OneOrders.order;// получение массива id
              var arr = [];
              //Получение товаров по id
              for (var i = 0; i < orderId.length; i++) {
                let OneOrderIdsplit = await autoPartsChara.findOne({"_id" : {"$in" : [ObjectId(orderId[i])]}});
                let str =  OneOrderIdsplit.nameTitle +'|'+OneOrderIdsplit.Article+'|'+OneOrderIdsplit.markAuto+'/'+OneOrderIdsplit.modelAuto+'|'+OneOrderIdsplit.price;
                arr.push(str);
              }
              //Формирование строки товара
                var StrInnerHTML = '';
              for (var i = 0; i < arr.length; i++) {
                let arrSplit = arr[i].split('|');
                let arrOrderNum = OneOrders.orderNum.split(',');
                let div =`
------------------------
Товар №${i+1}
Наименование: ${arrSplit[0]}
Артикул: ${arrSplit[1]}
Марка/Модель: ${arrSplit[2]}
Кол-во: ${arrOrderNum[i]}
Цена за шт: ${arrSplit[3]}
------------------------
`;
                StrInnerHTML = StrInnerHTML + div;
              }
                StrInnerHTML = StrInnerHTML + OneOrders.orderTotalPrice;

              var TextAdminOrder =
  `
  <i>Необработанных заявок осталось: ${colOrders}</i>;

  <i>Имя заказчика:</i> ${OneOrders.Name};
  <i>Связь:</i> ${OneOrders.communication};
  <i>Дата заказа:</i> ${OneOrders.date};
  <i>Товары:</i> ${StrInnerHTML};

  <b>Текст:</b> ${OneOrders.text};
  `
//Строка для чека
ctx.session.TextAdminOrder =
`
  Необработанных заявок осталось: ${colOrders};

  Имя заказчика: ${OneOrders.Name};
  Связь: ${OneOrders.communication};
  Дата заказа: ${OneOrders.date};
  Товары: ${StrInnerHTML};

  Текст: ${OneOrders.text};

`;

  await ctx.replyWithHTML(TextAdminOrder,Markup.inlineKeyboard(
  [
  [Markup.button.callback('🟢Подтвердить обработатку','But12'),Markup.button.callback('🟡Отложить -->','But13')],
  [Markup.button.callback('📄Выдать чек','But14')]
  ]
  ));
  ctx.session.idOrders = OneOrders._id;
  } else {await ctx.replyWithHTML(`
На данный момент <b>нет</b> необработанных заказов.
<i>Для просмотра отложенных заказов, используйте команду</i> /SpareOrdersDeferred
  `)
  }
  }catch (err) {console.log(err);}
        } else {console.error(err);}

      });

      }
  //----------------------------------------------------------------------------------------------------------------------
        adminPanel.action('But12', async (ctx) => {
          try{
            mongoClient.connect(async function(error, mongo) {
                if (!error) {
                  let db2 = mongo.db('NurmotorsAutopart');// подключение к бд
                  let Orders2 = db2.collection('Orders');//подключение коллеуции
                    await Orders2.updateOne({_id:ctx.session.idOrders}, {"$set": {"condition":"done"}});
                    ctx.telegram.deleteMessage(ctx.chat.id,ctx.update.callback_query.message.message_id)
                    connectMongoDB3();
                }else {console.error(err);}
            });
          }catch (err) {console.log(err);}

      });
      adminPanel.action('But13', async (ctx) => {
          try{
            mongoClient.connect(async function(error, mongo) {
                if (!error) {
                  let db3 = mongo.db('NurmotorsAutopart');// подключение к бд
                  let Orders3 = db3.collection('Orders');//подключение коллеуции
                    await Orders3.updateOne({_id:ctx.session.idOrders}, {"$set": {"condition":"postponed"}});
                    ctx.telegram.deleteMessage(ctx.chat.id,ctx.update.callback_query.message.message_id)
                    connectMongoDB3();
                }else {console.error(err);}
            });
          }catch (err) {console.log(err);}
      });
      adminPanel.action('But14', async (ctx) => {
        try{
          fs.writeFile('./cheque/cheque.txt', ctx.session.TextAdminOrder, function(err) {
          	if (err) {
          		console.log('ошибка');
          	}
          });
          ctx.telegram.sendDocument(ctx.from.id, {
            source: './cheque/cheque.txt',
            filename: 'cheque.txt'
  });
         }catch (err) {console.log(err);}
      });
  //----------------------------------------------------------------------------------------------------------------------
      connectMongoDB3();
});
//==================================================================================================
adminPanel.command('/SpareOrdersDeferred', async (ctx) => {
  var connectMongoDB4 = function () {
      mongoClient.connect(async function(error, mongo) {
        if (!error) {
            try{
              var db4 = mongo.db('NurmotorsAutopart');// подключение к бд
              var Orders4 = db4.collection('Orders');//подключение коллеуции
              var autoPartsChara = db4.collection('autoPartsChara');
              var colOrders = await Orders4.count({condition:"postponed"});//Кол-во ордеров
              if(colOrders != 0){
              var OneOrders = await Orders4.findOne({condition:"postponed"});//Получение первого эл
              var orderId = OneOrders.order;// получение массива id
              console.log(orderId);
              var arr = [];
              //Получение товаров по id
              for (var i = 0; i < orderId.length; i++) {
                let OneOrderIdsplit = await autoPartsChara.findOne({"_id" : {"$in" : [ObjectId(orderId[i])]}});
                let str = await OneOrderIdsplit.nameTitle +'|'+OneOrderIdsplit.Article+'|'+OneOrderIdsplit.markAuto+'/'+OneOrderIdsplit.modelAuto+'|'+OneOrderIdsplit.price;
                arr.push(str);
              }
              //Формирование строки товара
                var StrInnerHTML = '';
              for (var i = 0; i < arr.length; i++) {
                let arrSplit = arr[i].split('|');
                let arrOrderNum = OneOrders.orderNum.split(',');
                let div =`
------------------------
Товар №${i+1}
Наименование: ${arrSplit[0]}
Артикул: ${arrSplit[1]}
Марка/Модель: ${arrSplit[2]}
Кол-во: ${arrOrderNum[i]}
Цена за шт: ${arrSplit[3]}
------------------------
`;
                StrInnerHTML = StrInnerHTML + div;
              }
                StrInnerHTML = StrInnerHTML + OneOrders.orderTotalPrice;

              var TextAdminOrder =
  `
  <i>Необработанных заявок осталось: ${colOrders}</i>;

  <i>Имя заказчика:</i> ${OneOrders.Name};
  <i>Связь:</i> ${OneOrders.communication};
  <i>Дата заказа:</i> ${OneOrders.date};
  <i>Товары:</i> ${StrInnerHTML}

  <b>Текст:</b> ${OneOrders.text};
  `

  ctx.session.TextAdminOrder =
  `
    Необработанных заявок осталось: ${colOrders};

    Имя заказчика: ${OneOrders.Name};
    Связь: ${OneOrders.communication};
    Дата заказа: ${OneOrders.date};
    Товары: ${StrInnerHTML};

    Текст: ${OneOrders.text};

  `;

  await ctx.replyWithHTML(TextAdminOrder,Markup.inlineKeyboard(
  [
  [Markup.button.callback('🟢Подтвердить обработатку','But15'),Markup.button.callback('🟡Отложить -->','But16')],
  [Markup.button.callback('📄Выдать чек','But17')]
  ]
  ));
  ctx.session.idOrders = OneOrders._id;
  } else {await ctx.replyWithHTML(`
На данный момент <b>нет</b> необработанных отложенных заказов.
<i>Для обработки новых заказов воспользуйтесь командой</i> /SpareOrders
  `)
  }
  }catch (err) {console.log(err);}
        } else {console.error(err);}

      });

      }
  //----------------------------------------------------------------------------------------------------------------------
        adminPanel.action('But15', async (ctx) => {
          try{
            mongoClient.connect(async function(error, mongo) {
                if (!error) {
                  let db5 = mongo.db('NurmotorsAutopart');// подключение к бд
                  let Orders5 = db5.collection('Orders');//подключение коллеуции
                    await Orders5.updateOne({_id:ctx.session.idOrders}, {"$set": {"condition":"done"}});
                    ctx.telegram.deleteMessage(ctx.chat.id,ctx.update.callback_query.message.message_id);
                    connectMongoDB4();
                }else {console.error(err);}
            });
          }catch (err) {console.log(err);}

      });
      adminPanel.action('But16', async (ctx) => {
          try{
            mongoClient.connect(async function(error, mongo) {
                if (!error) {
                  let db6 = mongo.db('NurmotorsAutopart');// подключение к бд
                  let Orders6 = db6.collection('Orders');//подключение коллеуции
                    await Orders6.updateOne({_id:ctx.session.idOrders}, {"$set": {"condition":"postponed"}});
                    ctx.telegram.deleteMessage(ctx.chat.id,ctx.update.callback_query.message.message_id);
                    connectMongoDB4();
                }else {console.error(err);}
            });
          }catch (err) {console.log(err);}
      });

      adminPanel.action('But17', async (ctx) => {
        try{
          fs.writeFile('./cheque/cheque.txt', ctx.session.TextAdminOrder, function(err) {
          	if (err) {
          		console.log('ошибка');
          	}
          });
          ctx.telegram.sendDocument(ctx.from.id, {
     source: './cheque/cheque.txt',
     filename: 'cheque.txt'
  })
         }catch (err) {console.log(err);}
      });

  //----------------------------------------------------------------------------------------------------------------------
      connectMongoDB4();
});
//==================================================================================================

        adminPanel.command('/help', async (ctx) => {
            await ctx.replyWithHTML(`
<i>Ожидайте запросов пользователей</i>, либо воспользуйтесь командой
/orders - <b>получить список не обработанных заявок;</b>
/deferred - <b>получить список отложенных обращений;</b>
/AddAutoPart - <b>Добавить товар на сайт;</b>
/DeleteAutoPart - <b>Удалить товар на сайте;</b>
/ChangeAutoPart - <b>Изменить данный товара;</b>
/FindAProduct - <b>Найти товар по артикулу;</b>
/SpareOrders - <b>Получить список заказов на сайте;</b>
/SpareOrdersDeferred - <b>Получить список отложенных заказов на сайте;</b>
`
                )
        });

    return adminPanel
    }
AddAutoPart(){
  const AutoPart = new Scenes.BaseScene('AutoPart');
  try{
   AutoPart.enter(async (ctx) => {
  await ctx.replyWithHTML(
`
Для добавления новой запчасти, заполните данные
разделяя их символом "|"

<b>(Наименование|*Тип|Артикул|МаркаАвто|МодельАвто|Цена|Описание|*Категория|Страна производителя)</b>

<i>*Тип -</i> Короткое определение товара, например наименование "Свеча зажигания NGK 2669" будет иметь тип "Свеча зажигания"
*Категория - Подразделяется на: Двигатель, Подвеска, Тормоза, Выхлоп, Коробка передач, Жидкости, Электрооборудование, Экстерьер.

в одном сообщение по порядку <i>используя "|" как разделитель.</i>

<b>Пример: Свеча зажигания NGK 2669|Свеча зажигания|BKR9EIX|Audi|A7|688.00|Свеча зажигания NGK 2669 BKR9EIX новая|Электрооборудование|Япония</b>

Перед отправкой проверьте корректность введенных данных!
`
)
});
AutoPart.on('text', async (ctx) => {
ctx.session.AddAutoPart = await (ctx.message.text).split('|');
if((ctx.session.AddAutoPart).length == 9){
  await ctx.replyWithHTML(
  `
  Отправьте фотографию запчасти с <i>режимом сжатия</i> в формате <i>png</i> или <i>jpg</i>.
  `
  )
} else {
  ctx.telegram.deleteMessage(ctx.chat.id,ctx.message.message_id-1);
  await ctx.replyWithHTML(
`<b>Данные были введены не корректно, проверьте все ли пункты были заполнены!</b>`
  )
  ctx.scene.reenter();
}


});

AutoPart.on('message', async (ctx) => {
  try{
const files = ctx.update.message.photo;
console.log(files);
try{var fileId = await files[2].file_id;} catch (err) {
try{var fileId = await files[1].file_id;}catch (err) {
  var fileId = await files[0].file_id;
}

}

let res = await axios.get(`https://api.telegram.org/bot5115089738:AAEisdocA0J2kouJ9OErJAASxhRwzugazf8/getFile?file_id=${fileId}`).then(token => { return token } )
let file_path = await res.data.result.file_path;

ctx.session.ResFile_unique_id = res.data.result.file_unique_id;

var file = await fs.createWriteStream("../Diplom/public/img/details/"+res.data.result.file_unique_id + ".jpg");
var request = await https.get(`https://api.telegram.org/file/bot5115089738:AAEisdocA0J2kouJ9OErJAASxhRwzugazf8/${file_path}`, function(response) {
 response.pipe(file);});

   async function getNewAutoPart() {
   await ctx.replyWithPhoto({ source:"../Diplom/public/img/details/"+res.data.result.file_unique_id + ".jpg"},{ caption:
`
<i>Данные:</i>
<b>nameTitle:</b> ${ctx.session.AddAutoPart[0].trim()}
<b>type:</b> ${ctx.session.AddAutoPart[1].trim()}
<b>Article:</b> ${ctx.session.AddAutoPart[2].trim()}
<b>markAuto:</b> ${ctx.session.AddAutoPart[3].trim()}
<b>modelAuto:</b> ${ctx.session.AddAutoPart[4].trim()}
<b>price:</b> ${ctx.session.AddAutoPart[5].trim()}
<b>description:</b> ${ctx.session.AddAutoPart[6].trim()}
<b>category:</b> ${ctx.session.AddAutoPart[7].trim()}
<b>manufacturer:</b>${ctx.session.AddAutoPart[8].trim()}
`,parse_mode: 'HTML' }
);

await ctx.replyWithHTML(
`
Добавить новую запчасть?
`,Markup.inlineKeyboard(
     [
       [Markup.button.callback('🔴Отменить','But7'),Markup.button.callback('🟢Подтвердить','But8')],
       [Markup.button.callback('🟡Исправить','But9')]
     ]
   )
)

   }
   setTimeout(getNewAutoPart, 1500);

}catch (err) {console.log(err);}
});

AutoPart.action('But7', async (ctx) => {
    try{
      ctx.telegram.deleteMessage(ctx.chat.id,ctx.update.callback_query.message.message_id);
      ctx.telegram.deleteMessage(ctx.chat.id,ctx.update.callback_query.message.message_id - 1);
      ctx.telegram.deleteMessage(ctx.chat.id,ctx.update.callback_query.message.message_id - 2);
      ctx.telegram.deleteMessage(ctx.chat.id,ctx.update.callback_query.message.message_id - 3);
      ctx.telegram.deleteMessage(ctx.chat.id,ctx.update.callback_query.message.message_id - 4);
      ctx.telegram.deleteMessage(ctx.chat.id,ctx.update.callback_query.message.message_id - 5);
        fs.unlinkSync("../Diplom/public/img/details/"+ctx.session.ResFile_unique_id + ".jpg");
        await ctx.scene.enter('adminPanel');
    }catch (err) {console.log(err);}
});

AutoPart.action('But8', async (ctx) => {
    try{
//========================================================================================================
      mongoClient.connect(async function(error, mongo) {
        if (!error) {
            try{
              var db = mongo.db('NurmotorsAutopart');// подключение к бд
              var autoPartsChara = db.collection('autoPartsChara');//подключение коллеуции
              var autopart = db.collection('autopart');
              var checkMarkAuto = await autopart.findOne({brandAuto: (ctx.session.AddAutoPart[3].trim()).charAt(0).toUpperCase() + ctx.session.AddAutoPart[3].trim().slice(1)});
          //--------------------------------------------------------------------------------------------------------------------------------------------------------------------------
              if (checkMarkAuto == null) {
            await ctx.replyWithHTML('<i>Такой марки нет в каталоге!</i> Обратитесь к вебмастеру.');
            fs.unlinkSync("../Diplom/public/img/details/"+ctx.session.ResFile_unique_id + ".jpg");
              await ctx.scene.enter('adminPanel');
              //--------------------------------------------------------------------------------------------------------------------------------------------------------------------------
            } else {
                  //--------------------------------------------------------------------------------------------------------------------------------------------------------------------------
              let NewAutopart = {
                nameTitle:ctx.session.AddAutoPart[0].trim(),
                type:ctx.session.AddAutoPart[1].trim(),
                Article:ctx.session.AddAutoPart[2].trim(),
                image:"../Diplom/public/img/details/"+ctx.session.ResFile_unique_id + ".jpg",
                markAuto:ctx.session.AddAutoPart[3].trim(),
                modelAuto:ctx.session.AddAutoPart[4].trim(),
                price:Number(ctx.session.AddAutoPart[5].trim()),
                description:ctx.session.AddAutoPart[6].trim(),
                category:ctx.session.AddAutoPart[7].trim(),
                manufacturer:ctx.session.AddAutoPart[8].trim()
              }
              await autoPartsChara.insertOne(NewAutopart);
              //--------------------------------------------------------------------------------------------------------------------------------------------------------------------------
              var GetNewAutopart = await autoPartsChara.findOne({nameTitle:ctx.session.AddAutoPart[0].trim(),type:ctx.session.AddAutoPart[1].trim(),Article:ctx.session.AddAutoPart[2].trim(),markAuto:ctx.session.AddAutoPart[3].trim(),
              modelAuto:ctx.session.AddAutoPart[4].trim(),price:Number(ctx.session.AddAutoPart[5].trim()),description:ctx.session.AddAutoPart[6].trim(),category:ctx.session.AddAutoPart[7].trim(),manufacturer:ctx.session.AddAutoPart[8].trim()});

              var IDGetNewAutopart = await GetNewAutopart._id;
            var IDcheckMarkAuto = await checkMarkAuto._id;
            var BoolMarkAuto = await false;
            for (var i = 0; i < checkMarkAuto.modelAuto.length; i++) {
              if(checkMarkAuto.modelAuto[i].Model == ctx.session.AddAutoPart[4].trim()){
                BoolMarkAuto = await true;
                break;
              }
            }
            //--------------------------------------------------------------------------------------------------------------------------------------------------------------------------
          if (BoolMarkAuto == false) {
             autopart.updateOne({_id : IDcheckMarkAuto}, {$addToSet: {modelAuto:{Model:ctx.session.AddAutoPart[4].trim(),AutoParts:[IDGetNewAutopart]}}});
             await ctx.replyWithHTML('<b>Запчасть добавлена!</b>');
             ctx.telegram.deleteMessage(ctx.chat.id,ctx.update.callback_query.message.message_id);
             ctx.telegram.deleteMessage(ctx.chat.id,ctx.update.callback_query.message.message_id - 1);
             ctx.telegram.deleteMessage(ctx.chat.id,ctx.update.callback_query.message.message_id - 2);
             ctx.telegram.deleteMessage(ctx.chat.id,ctx.update.callback_query.message.message_id - 3);
             ctx.telegram.deleteMessage(ctx.chat.id,ctx.update.callback_query.message.message_id - 4);
             ctx.telegram.deleteMessage(ctx.chat.id,ctx.update.callback_query.message.message_id - 5);
             await ctx.scene.enter('adminPanel');
          } else if (BoolMarkAuto == true) {
             checkMarkAuto = await autopart.findOne({brandAuto: (ctx.session.AddAutoPart[3].trim()).charAt(0).toUpperCase() + ctx.session.AddAutoPart[3].trim().slice(1)});
             db.collection('autopart').updateOne({"modelAuto.Model" : ctx.session.AddAutoPart[4].trim()}, {"$push" : {"modelAuto.$.AutoParts" : IDGetNewAutopart}})
             await ctx.replyWithHTML('<b>Запчасть добавлена!</b>');
             ctx.telegram.deleteMessage(ctx.chat.id,ctx.update.callback_query.message.message_id);
             ctx.telegram.deleteMessage(ctx.chat.id,ctx.update.callback_query.message.message_id - 1);
             ctx.telegram.deleteMessage(ctx.chat.id,ctx.update.callback_query.message.message_id - 2);
             ctx.telegram.deleteMessage(ctx.chat.id,ctx.update.callback_query.message.message_id - 3);
             ctx.telegram.deleteMessage(ctx.chat.id,ctx.update.callback_query.message.message_id - 4);
             ctx.telegram.deleteMessage(ctx.chat.id,ctx.update.callback_query.message.message_id - 5);
             await ctx.scene.enter('adminPanel');
          }
              //--------------------------------------------------------------------------------------------------------------------------------------------------------------------------
            }
          }catch (err) {console.log(err);}
              } else {console.error(err);}
            });
//========================================================================================================
    }catch (err) {console.log(err);}
});

AutoPart.action('But9', async (ctx) => {
    try{
      ctx.telegram.deleteMessage(ctx.chat.id,ctx.update.callback_query.message.message_id);
      ctx.telegram.deleteMessage(ctx.chat.id,ctx.update.callback_query.message.message_id - 1);
      ctx.telegram.deleteMessage(ctx.chat.id,ctx.update.callback_query.message.message_id - 2);
      ctx.telegram.deleteMessage(ctx.chat.id,ctx.update.callback_query.message.message_id - 3);
      fs.unlinkSync("../Diplom/public/img/details/"+ctx.session.ResFile_unique_id + ".jpg");
        ctx.scene.reenter();
    }catch (err) {console.log(err);}
});

}catch (err) {console.log(err);}


      return AutoPart
}

//=========================================================================
//=========================================================================
DeleteAutoPart(){
  const DeletePart = new Scenes.BaseScene('DeletePart');
  try{
    DeletePart.enter(async (ctx) => {
    await ctx.replyWithHTML(
    `
    <i>Введите:</i>
    <b>(Наименование|МаркаАвто|МодельАвто)</b>
    <b>Пример: Свеча зажигания NGK 2669|Audi|A7</b>
    Либо напишите Отмена.
    `,Markup.keyboard(['Отмена']).oneTime().resize());
    });

      DeletePart.on('text', async (ctx) => {
        ctx.session.DelAutoPart = await (ctx.message.text).split('|');
        console.log(ctx.session.DelAutoPart);
        if((ctx.message.text).toUpperCase() == "ОТМЕНА") {
        ctx.replyWithHTML('Удаление отменено',Markup.removeKeyboard(true))
        await ctx.scene.enter('adminPanel');
      } else {
        if((ctx.session.DelAutoPart).length == 3){
        mongoClient.connect(async function(error, mongo) {
          if (!error) {
              var db = mongo.db('NurmotorsAutopart');// подключение к бд
              var autoPartsChara = db.collection('autoPartsChara');//подключение коллеуции
              var autopart = db.collection('autopart');
              var checkAutoPartsChara = await autoPartsChara.findOne({nameTitle:ctx.session.DelAutoPart[0].trim() ,
                markAuto:ctx.session.DelAutoPart[1].trim(),
                modelAuto:ctx.session.DelAutoPart[2].trim()});
                if(checkAutoPartsChara == null){
                    await ctx.replyWithHTML('Такой запчасти не найдено!',Markup.removeKeyboard(true));
                    ctx.scene.reenter();
                } else{
                //-----------------------------------------------------------------------------------------
                  async function getAutoPart() {
                  await ctx.replyWithPhoto({ source:checkAutoPartsChara.image},{ caption:
`
<i>Данные:</i>
<b>nameTitle:</b> ${checkAutoPartsChara.nameTitle}
<b>type:</b> ${checkAutoPartsChara.type}
<b>Article:</b> ${checkAutoPartsChara.Article}
<b>markAuto:</b> ${checkAutoPartsChara.Audi}
<b>modelAuto:</b> ${checkAutoPartsChara.modelAuto}
<b>price:</b> ${checkAutoPartsChara.price}
<b>description:</b> ${checkAutoPartsChara.description}
<b>category:</b> ${checkAutoPartsChara.category}
`,parse_mode: 'HTML' });

               await ctx.replyWithHTML(
               `
               Удалить эту запчасть?
               `,Markup.inlineKeyboard(
                    [
                      [Markup.button.callback('🔴Отменить','But10'),Markup.button.callback('🟢Подтвердить','But11')]
                    ]
                  )
               )

                  }
                  setTimeout(getAutoPart, 1500);

                }
                //-----------------------------------------------------------------------------------------
        }else {console.error(err)}
      });

      }else {
        await ctx.replyWithHTML(`Данные введены не корректно, повторите попытку!`,Markup.removeKeyboard(true));
        ctx.scene.reenter();
      }
      }
      });

      DeletePart.action('But10', async (ctx) => {
          try{
            ctx.telegram.deleteMessage(ctx.chat.id,ctx.update.callback_query.message.message_id);
            ctx.telegram.deleteMessage(ctx.chat.id,ctx.update.callback_query.message.message_id - 1);
            ctx.telegram.deleteMessage(ctx.chat.id,ctx.update.callback_query.message.message_id - 2);
            await ctx.replyWithHTML('Удаление отменено!',Markup.removeKeyboard(true));
              await ctx.scene.enter('adminPanel');
          }catch (err) {console.log(err);}
      });
      DeletePart.action('But11', async (ctx) => {
          try{
            ctx.telegram.deleteMessage(ctx.chat.id,ctx.update.callback_query.message.message_id);
            ctx.telegram.deleteMessage(ctx.chat.id,ctx.update.callback_query.message.message_id - 1);
            ctx.telegram.deleteMessage(ctx.chat.id,ctx.update.callback_query.message.message_id - 2);

            mongoClient.connect(async function(error, mongo) {
              if (!error) {
                  var db = mongo.db('NurmotorsAutopart');// подключение к бд
                  var autoPartsChara = db.collection('autoPartsChara');//подключение коллеуции
                  var autopart = db.collection('autopart');
                  var checkAutoPartsChara = await autoPartsChara.findOne({nameTitle:ctx.session.DelAutoPart[0].trim() ,
                    markAuto:ctx.session.DelAutoPart[1].trim(),
                    modelAuto:ctx.session.DelAutoPart[2].trim()});
                    if(checkAutoPartsChara == null){
                        await ctx.replyWithHTML('Такой детали не найдено');
                        ctx.scene.reenter();
                    } else{
                    let IdCheckAutoPartsChara = checkAutoPartsChara._id;
                    fs.unlinkSync(checkAutoPartsChara.image);
                    await autoPartsChara.deleteOne({nameTitle: ctx.session.DelAutoPart[0].trim(),
                      markAuto:ctx.session.DelAutoPart[1].trim(),
                      modelAuto:ctx.session.DelAutoPart[2].trim()});
                       db.collection('autopart').updateOne({brandAuto:ctx.session.DelAutoPart[1].trim(),"modelAuto.Model" : ctx.session.DelAutoPart[2].trim()}, {"$pull" : {"modelAuto.$.AutoParts" : IdCheckAutoPartsChara}});
                       await ctx.replyWithHTML('Товар <b>успешно</b> удален!',Markup.removeKeyboard(true));
                       await ctx.scene.enter('adminPanel');
                    }

            }else {console.error(err)}
          });
          }catch (err) {console.log(err);}
      });

  } catch (err) {console.log(err);}

return DeletePart
}
//=========================================================================
//=========================================================================
СhangeAutoPart(){
  const ChangePart = new Scenes.BaseScene('ChangePart');
  try{
    ChangePart.enter(async (ctx) => {
    await ctx.replyWithHTML(
    `
    <i>Для изменения товара введите:</i>
    <b>(Наименование|МаркаАвто|МодельАвто)</b>
    <b>Пример: Свеча зажигания NGK 2669|Audi|A7</b>
    Либо напишите <b>Отмена</b>.
    `,Markup.keyboard(['Отмена']).oneTime().resize());
  });

    ChangePart.on('text', async (ctx) => {
      ctx.session.СhangeAutoPart = await (ctx.message.text).split('|');
      if((ctx.message.text).toUpperCase() == "ОТМЕНА") {
      ctx.replyWithHTML('Изменение отменено',Markup.removeKeyboard(true))
      await ctx.scene.enter('adminPanel');
    } else {
      if((ctx.session.СhangeAutoPart).length == 3){
        mongoClient.connect(async function(error, mongo) {
          if (!error) {
              var db = mongo.db('NurmotorsAutopart');// подключение к бд
              var autoPartsChara = db.collection('autoPartsChara');//подключение коллеуции
              var autopart = db.collection('autopart');
              var checkAutoPartsChara = await autoPartsChara.findOne({nameTitle:ctx.session.СhangeAutoPart[0].trim() ,
                markAuto:ctx.session.СhangeAutoPart[1].trim(),
                modelAuto:ctx.session.СhangeAutoPart[2].trim()});
                if(checkAutoPartsChara == null){
                    await ctx.replyWithHTML('Такой запчасти не найдено!');
                    ctx.scene.reenter();
                } else{
                //-----------------------------------------------------------------------------------------
                  async function getAutoPart() {
                  await ctx.replyWithPhoto({ source:checkAutoPartsChara.image},{ caption:
`
<i>Данные найденной запчати:</i>
<b>nameTitle:</b> ${checkAutoPartsChara.nameTitle}
<b>type:</b> ${checkAutoPartsChara.type}
<b>Article:</b> ${checkAutoPartsChara.Article}
<b>markAuto:</b> ${checkAutoPartsChara.markAuto}
<b>modelAuto:</b> ${checkAutoPartsChara.modelAuto}
<b>price:</b> ${checkAutoPartsChara.price}
<b>description:</b> ${checkAutoPartsChara.description}
<b>category:</b> ${checkAutoPartsChara.category}
`,parse_mode: 'HTML' });

               await ctx.replyWithHTML('Что нужно изменить?',Markup.keyboard([['nameTitle','type','Article'],['markAuto','modelAuto','price'],['description','image','category'],['Отмена']]).oneTime().resize());
                  }
                  setTimeout(getAutoPart, 1000);
                  await ctx.scene.enter('ChangePartNext');
                }
                //-----------------------------------------------------------------------------------------
        }else {console.error(err)}
        });

      }else {
        await ctx.replyWithHTML(`Данные введены не корректно, повторите попытку!`,Markup.removeKeyboard(true));

        ctx.scene.reenter();
      }
    }
  });
} catch (err) {console.log(err)}
  return ChangePart
}

ChangeAutoPartNext1(){
  const ChangePartNext = new Scenes.BaseScene('ChangePartNext');
  try{
      ChangePartNext.on('text', async (ctx) => {
        ctx.session.СhangeAutoPartComand = await ctx.message.text;
        if (ctx.session.СhangeAutoPartComand == 'nameTitle' ||ctx.session.СhangeAutoPartComand == 'type' ||ctx.session.СhangeAutoPartComand == 'Article' ||ctx.session.СhangeAutoPartComand == 'markAuto' ||ctx.session.СhangeAutoPartComand == 'modelAuto' ||ctx.session.СhangeAutoPartComand == 'price' ||ctx.session.СhangeAutoPartComand == 'description'||ctx.session.СhangeAutoPartComand == 'category'){
          ctx.replyWithHTML('Напишите новое значение:',Markup.removeKeyboard(true));
          await ctx.scene.enter('ChangePartNext2');
        } else if (ctx.session.СhangeAutoPartComand == 'image') {
            ctx.replyWithHTML('Отправьте новое изображение:',Markup.removeKeyboard(true));
            await ctx.scene.enter('NewImage');
        } if (ctx.session.СhangeAutoPartComand == 'Отмена'){
          ctx.replyWithHTML('Отправьте новое изображение:',Markup.removeKeyboard(true));
          await ctx.scene.enter('NewImage');
        } else {
          //ctx.replyWithHTML('Такого пункта нет у товара!');
          ctx.scene.reenter();
        }
        });
      }catch (err) {console.log(err)}
        return ChangePartNext
      }

  ChangeAutoPartNext2(){
    const ChangePartNext2 = new Scenes.BaseScene('ChangePartNext2');
    try{
        ChangePartNext2.on('text', async (ctx) => {
          ctx.session.СhangeAutoPartNewText = await ctx.message.text;
          mongoClient.connect(async function(error, mongo) {
            var db = mongo.db('NurmotorsAutopart');// подключение к бд
            var autoPartsChara = db.collection('autoPartsChara');//подключение коллеуции
            var autopart = db.collection('autopart');

            if (!error) {
          switch (ctx.session.СhangeAutoPartComand) {
          case 'nameTitle':
          await autoPartsChara.updateOne({nameTitle:ctx.session.СhangeAutoPart[0].trim() ,
            markAuto:ctx.session.СhangeAutoPart[1].trim(),
            modelAuto:ctx.session.СhangeAutoPart[2].trim()}, {$set: {nameTitle: ctx.session.СhangeAutoPartNewText}});
          ctx.replyWithHTML(
`<b>Значение товара было изменено на -</b> ${ctx.session.СhangeAutoPartComand}: ${ctx.session.СhangeAutoPartNewText}
`);
          await ctx.scene.enter('adminPanel');
            break;
          case 'type':
          await autoPartsChara.updateOne({nameTitle:ctx.session.СhangeAutoPart[0].trim() ,
            markAuto:ctx.session.СhangeAutoPart[1].trim(),
            modelAuto:ctx.session.СhangeAutoPart[2].trim()}, {$set: {type: ctx.session.СhangeAutoPartNewText}});
          ctx.replyWithHTML(
`<b>Значение товара было изменено на -</b> ${ctx.session.СhangeAutoPartComand}: ${ctx.session.СhangeAutoPartNewText}
`);
          await ctx.scene.enter('adminPanel');
            break;
          case 'Article':
          await autoPartsChara.updateOne({nameTitle:ctx.session.СhangeAutoPart[0].trim() ,
            markAuto:ctx.session.СhangeAutoPart[1].trim(),
            modelAuto:ctx.session.СhangeAutoPart[2].trim()}, {$set: {Article: ctx.session.СhangeAutoPartNewText}});
          ctx.replyWithHTML(
`<b>Значение товара было изменено на -</b> ${ctx.session.СhangeAutoPartComand}: ${ctx.session.СhangeAutoPartNewText}
`);
          await ctx.scene.enter('adminPanel');
            break;
          case 'markAuto':
          await autoPartsChara.updateOne({nameTitle:ctx.session.СhangeAutoPart[0].trim() ,
            markAuto:ctx.session.СhangeAutoPart[1].trim(),
            modelAuto:ctx.session.СhangeAutoPart[2].trim()}, {$set: {markAuto: ctx.session.СhangeAutoPartNewText}});
          ctx.replyWithHTML(
`<b>Значение товара было изменено на -</b> ${ctx.session.СhangeAutoPartComand}: ${ctx.session.СhangeAutoPartNewText}
`);
          await ctx.scene.enter('adminPanel');
            break;
          case 'modelAuto':
          await autoPartsChara.updateOne({nameTitle:ctx.session.СhangeAutoPart[0].trim() ,
            markAuto:ctx.session.СhangeAutoPart[1].trim(),
            modelAuto:ctx.session.СhangeAutoPart[2].trim()}, {$set: {modelAuto: ctx.session.СhangeAutoPartNewText}});
          ctx.replyWithHTML(
`<b>Значение товара было изменено на -</b> ${ctx.session.СhangeAutoPartComand}: ${ctx.session.СhangeAutoPartNewText}
`);
          await ctx.scene.enter('adminPanel');
            break;
          case 'price':
          await autoPartsChara.updateOne({nameTitle:ctx.session.СhangeAutoPart[0].trim() ,
            markAuto:ctx.session.СhangeAutoPart[1].trim(),
            modelAuto:ctx.session.СhangeAutoPart[2].trim()}, {$set: {price: Number(ctx.session.СhangeAutoPartNewText)}});
          ctx.replyWithHTML(
`<b>Значение товара было изменено на -</b> ${ctx.session.СhangeAutoPartComand}: ${ctx.session.СhangeAutoPartNewText}
`);
          await ctx.scene.enter('adminPanel');
            break;
          case 'description':
          await autoPartsChara.updateOne({nameTitle:ctx.session.СhangeAutoPart[0].trim() ,
            markAuto:ctx.session.СhangeAutoPart[1].trim(),
            modelAuto:ctx.session.СhangeAutoPart[2].trim()}, {$set: {description: ctx.session.СhangeAutoPartNewText}});
          ctx.replyWithHTML(
`<b>Значение товара было изменено на -</b> ${ctx.session.СhangeAutoPartComand}: ${ctx.session.СhangeAutoPartNewText}
`);
          await ctx.scene.enter('adminPanel');
            break;
            case 'category':
            await autoPartsChara.updateOne({nameTitle:ctx.session.СhangeAutoPart[0].trim() ,
              markAuto:ctx.session.СhangeAutoPart[1].trim(),
              modelAuto:ctx.session.СhangeAutoPart[2].trim()}, {$set: {category: ctx.session.СhangeAutoPartNewText}});
            ctx.replyWithHTML(
  `<b>Значение товара было изменено на -</b> ${ctx.session.СhangeAutoPartComand}: ${ctx.session.СhangeAutoPartNewText}
  `);
            await ctx.scene.enter('adminPanel');
            break;
          default:
            ctx.replyWithHTML("Такого пункта нет у товара!");
            await ctx.scene.enter('ChangePart');
          }
        } else {console.error(err)}
      });
    });
  }catch (err) {console.log(err)}
    return ChangePartNext2
  }

  NewImage(){
    const NewImage = new Scenes.BaseScene('NewImage');
    try{

      NewImage.on('message', async (ctx) => {
      const files = ctx.update.message.photo;
      try{var fileId = await files[2].file_id;} catch (err) {
      try{var fileId = await files[1].file_id;}catch (err) {
        var fileId = await files[0].file_id;}}

      let res = await axios.get(`https://api.telegram.org/bot5115089738:AAEisdocA0J2kouJ9OErJAASxhRwzugazf8/getFile?file_id=${fileId}`).then(token => { return token } )
      let file_path = await res.data.result.file_path;

      ctx.session.ResFile_unique_id = res.data.result.file_unique_id;

      var file = await fs.createWriteStream("../Diplom/public/img/details/"+res.data.result.file_unique_id + ".jpg");
      var request = await https.get(`https://api.telegram.org/file/bot5115089738:AAEisdocA0J2kouJ9OErJAASxhRwzugazf8/${file_path}`, function(response) {
       response.pipe(file);});

       mongoClient.connect(async function(error, mongo) {
         var db = mongo.db('NurmotorsAutopart');// подключение к бд
         var autoPartsChara = db.collection('autoPartsChara');//подключение коллеуции
         var autopart = db.collection('autopart');
         var checkAutoPartsChara = await autoPartsChara.findOne({nameTitle:ctx.session.СhangeAutoPart[0].trim() ,
           markAuto:ctx.session.СhangeAutoPart[1].trim(),
           modelAuto:ctx.session.СhangeAutoPart[2].trim()});

       await autoPartsChara.updateOne({nameTitle:ctx.session.СhangeAutoPart[0].trim() ,
         markAuto:ctx.session.СhangeAutoPart[1].trim(),
         modelAuto:ctx.session.СhangeAutoPart[2].trim()}, {$set: {image:`../Diplom/public/img/details/${ctx.session.ResFile_unique_id}.jpg`}});

         fs.unlinkSync(checkAutoPartsChara.image);
         await ctx.replyWithHTML(`Изображение товара было успешно изменено!`);
         await ctx.scene.enter('adminPanel');
       });

     });

    }catch (err) {console.log(err)}
      return NewImage

  }
//=========================================================================
//=========================================================================

FindAProduct(){
  const FindProduct = new Scenes.BaseScene('FindProduct');
  try{
    FindProduct.enter(async (ctx) => {
    await ctx.replyWithHTML(
    `
<b>Введите артикул товара для его поиска</b>
Либо напишите <b>Отмена</b>.
    `,Markup.keyboard(['Отмена']).oneTime().resize());
  });

  FindProduct.on('text', async (ctx) => {
    ctx.session.FindProduct = await (ctx.message.text);
    if((ctx.message.text).toUpperCase() == "ОТМЕНА") {
    ctx.replyWithHTML('Изменение отменено',Markup.removeKeyboard(true))
    await ctx.scene.enter('adminPanel');
  } else {
    mongoClient.connect(async function(error, mongo) {
      if (!error) {
          var db = mongo.db('NurmotorsAutopart');// подключение к бд
          var autoPartsChara = db.collection('autoPartsChara');//подключение коллеуции
          var autopart = db.collection('autopart');
          var SerchProduct = await autoPartsChara.findOne({Article:ctx.session.FindProduct});
          if(SerchProduct == null){
              await ctx.replyWithHTML('Такой запчасти не найдено!',Markup.removeKeyboard(true));
              ctx.scene.reenter();
          } else{
          await ctx.replyWithPhoto({ source:SerchProduct.image},{ caption:
`
<i>Данные найденной запчати:</i>
<b>nameTitle:</b> ${SerchProduct.nameTitle}
<b>type:</b> ${SerchProduct.type}
<b>Article:</b> ${SerchProduct.Article}
<b>markAuto:</b> ${SerchProduct.markAuto}
<b>modelAuto:</b> ${SerchProduct.modelAuto}
<b>price:</b> ${SerchProduct.price}
<b>description:</b> ${SerchProduct.description}
`,parse_mode: 'HTML' });
await ctx.scene.enter('adminPanel');
}
        }else {console.error(err)}
      });
    }
});

  }catch (err) {console.log(err)}
  return FindProduct
}
//=========================================================================
//=========================================================================
//=========================================================================
//=========================================================================
}
module.exports = SceneGeneratorAdmin
