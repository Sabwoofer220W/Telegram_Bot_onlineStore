const { Telegraf, session, Markup } = require('telegraf');
const {Scenes} = require('telegraf');
require('dotenv').config();
const ADMIN_CHAT_ID = process.env.ADMIN_CHAT_ID;
const Captcha = require('./captcha/CreateCaptcha.js');
const fs = require("fs")
const { nanoid } = require("nanoid");
const mongodb = require('mongodb');
const mongoClient = new mongodb.MongoClient('MongoPass', {
        useUnifiedTopology: true
      });
const date = require('date-and-time');
//--------------------------------------------------
class SceneGenerator {
//=====================================================================
//=====================================================================
  StartOrder () {
    const order = new Scenes.BaseScene('order');
    order.enter(async (ctx) => {
await ctx.replyWithHTML(
`Мы рады что вы решили обратиться к нам. Укажите свое <b>имя</b> или напишите <i>Отмена.</i>`,Markup
.keyboard(
  ['Отмена']
)
.oneTime()
.resize()
)

   })

order.on('text', async (ctx) => {
ctx.session.name = ctx.message.text;
 if (ctx.session.name.toUpperCase() == 'ОТМЕНА'){
await ctx.reply(`Заявка отменена!`);
await ctx.scene.leave()
 } else {
 await ctx.reply(`Хорошо, ${ctx.session.name}`);
 ctx.scene.enter('Select')
}
})

    return order
  }

//=====================================================================
//=====================================================================
ConnectionSelection(){
  const Select = new Scenes.BaseScene('Select');
  Select.enter(async (ctx) => {
    await ctx.replyWithHTML(`<b>Как нам связяться с вами?</b>`,Markup
    .keyboard([
      ['Позвоните мне или напишите на почту'],
      ['Напишите в телеграм']
    ])
    .oneTime()
    .resize()
    );
       });

       Select.on('text', async (ctx) => {
        ctx.session.ConnectionSelection = ctx.message.text;
        if (ctx.session.ConnectionSelection == 'Позвоните мне или напишите на почту') {
          ctx.session.communicationTg = false;
          ctx.scene.enter('con');
        } else if(ctx.session.ConnectionSelection == 'Напишите в телеграм'){
          ctx.session.numOrPhon = "Напишите в телеграм";
          ctx.scene.enter('text');
        } else {
          await ctx.replyWithHTML(`<b>Выбирите вариант связи, "Позвоните мне или напишите на почту" или "Напишите в телеграм"</b>`);
          ctx.scene.reenter()
        }

        })

  return Select
}
//=====================================================================
//=====================================================================
СonnectionOrder () {
  const con = new Scenes.BaseScene('con');
con.enter((ctx) => ctx.replyWithHTML(`Введите свой <i>номер телефона</i> либо <i>электронную почту</i> для связи. Или напишите <b>отмена</b>.`,Markup
.keyboard(
  ['Отмена']
)
.oneTime()
.resize()));
con.on('text', async (ctx) => {
 ctx.session.numOrPhon = ctx.message.text;
if (ctx.session.numOrPhon.toUpperCase() == 'ОТМЕНА'){
await ctx.reply(`Заявка отменена!`);
await ctx.scene.leave()
} else {
  let reMail = /^[\w-\.]+@[\w-]+\.[a-z]{2,4}$/i;
  let rePhone = /^\d[\d\(\)\ -]{4,14}\d$/;
  let validMail = reMail.test(ctx.session.numOrPhon);
  let validPhone = rePhone.test(ctx.session.numOrPhon);

  if(validMail == true){
    await ctx.reply(`${ctx.session.numOrPhon} - это ваша почта, верно?`, Markup
    .keyboard(['Верно', 'Не верно'])
    .oneTime()
    .resize());
    ctx.scene.enter('NumOrPhonCheck');
  } else if (validPhone == true) {
    await ctx.reply(`${ctx.session.numOrPhon} - это ваш номер, верно?`,Markup
    .keyboard(['Верно', 'Не верно'])
    .oneTime()
    .resize());
    ctx.scene.enter('NumOrPhonCheck');
  } else {
    await ctx.reply(`Возможно вы ввели что-то не корректно! Повторите попытку`);
    ctx.scene.reenter()
  }
}
});

  return con
}

//=====================================================================
//=====================================================================
CheckNumOrPhon () {
  const NumOrPhonCheck = new Scenes.BaseScene('NumOrPhonCheck');
  NumOrPhonCheck.on('text', async (ctx) => {
  ctx.session.answerNumOrPhon = ctx.message.text;
  if (ctx.session.answerNumOrPhon.toUpperCase() == "НЕ ВЕРНО") {
  await ctx.reply(`Давайте повторим!`,Markup
  .removeKeyboard(true));
  ctx.scene.enter('con');
} else if(ctx.session.answerNumOrPhon.toUpperCase() == "ВЕРНО") {
  await ctx.reply(`Отлично!`,Markup
  .removeKeyboard(true));
  ctx.scene.enter('text');
} else {
  await ctx.replyWithHTML(`Введите либо <u>"Верно"</u> либо <u>"Не верно"</u>`);
  ctx.scene.reenter()
}
  });
  return NumOrPhonCheck
}

//=====================================================================
//=====================================================================
TextOrder () {
  const text = new Scenes.BaseScene('text');
  text.enter((ctx) => ctx.replyWithHTML(`Напишите текст обращения, <i>если нужно приложить фото или видео</i>, для начала <u>загрузите их на Яндекс.Диск или Google.Drive</u> и приложите ссылку вместе с текстом! Если вам не ответили на предыдущую заявку, оставьте в обращении ссылку на свой профиль Либо напишите <b>отмена</b>. `,Markup
  .removeKeyboard(true)));
  text.on('text', async (ctx) => {
    ctx.session.TextOrder = ctx.message.text;
if (ctx.session.TextOrder.toUpperCase() == 'ОТМЕНА'){
    await ctx.reply(`Заявка отменена!`);
    await ctx.scene.leave()
  } else {
    await ctx.reply(`Принято!`);
    ctx.session.EndOrder =`
    _Появилась новая заявка_\\! Используйте команду /orders\\.
    `
/* `
_Новая заявка:_
*Имя:* ${ctx.session.name};
*Имя в телеграмм:* ${ctx.message.chat.first_name};
*Ссылка на профиль:* @${ctx.message.chat.username};
*Связь:* ${(ctx.session.numOrPhon).replace(/[^a-zа-яё0-9\s]/gi, ' ')}
*Текст:* ${(ctx.session.TextOrder).replace(/[^a-zа-яё0-9,.\s]/gi, ' ')}
    `*/

    await ctx.replyWithHTML(
`
<i>Ваша зявка:</i>
<b>Имя: </b> ${ctx.session.name} ;
<b>Связь: </b> ${ctx.session.numOrPhon} ;
<b>Текст: </b> ${ctx.session.TextOrder}
`, Markup.inlineKeyboard(
        [
          [Markup.button.callback('Отправить','show_more1'),Markup.button.callback('Отмена','show_more2')]
        ]
      ));
      text.action('show_more1', async (ctx) => {
                try {
                  ctx.scene.enter('cap');
                } catch (err) {
                console.log(err);
              }
            });
      text.action('show_more2', async (ctx) => {
                    try {
                        await ctx.reply(`Заявка отменена!`);
                        ctx.scene.leave()
                      } catch (err) {
                      console.log(err);
                    }
                  });
  }


});
return text
}
//=====================================================================
//=====================================================================

CaptchaCheck() {
  const cap = new Scenes.BaseScene('cap');
  cap.enter(async (ctx) => {
  ctx.session.Captcha = Captcha.CreateCaptcha();
  async function getCaptca() {
  await ctx.replyWithPhoto({ source:'./captcha/cap.png'},{ caption: "*Введите капчу для отправки заявки, либо напишите отмена*",parse_mode: 'MarkdownV2' });
  }
  setTimeout(getCaptca, 2000);
  })
  cap.on('text', async (ctx) => {

  ctx.session.textCaptcha = ctx.message.text;
  if((ctx.session.textCaptcha).toUpperCase() == ctx.session.Captcha){

    await ctx.replyWithHTML(`
<b>Заявка отправлена!</b> Наш сотрудник свяжется с вами в ближайшее время!
Если вы не получите ответ в течении часа, <b>отправьте заявку повторно!</b>
`);
    var connectMongoDB = function () {
      mongoClient.connect(async function(error, mongo) {
        if (!error) {

              let db = mongo.db('TgNormotors');// подключение к бд
              let clients = db.collection('clients');//подключение коллеуции
              let orderTest = await clients.findOne({TgName: '@'+ctx.message.chat.username});
              if (orderTest == null) {
                let newUser = {
                  name: ctx.message.chat.first_name,
                  pedido: false,
                  TgName:`@${ctx.message.chat.username}`,
                  order: []
                }
                await clients.insertOne(newUser);
              } else {
                clients.updateOne({TgName: '@'+ctx.message.chat.username}, {$set: {pedido:false}})
              }
              let order = {
                id:nanoid(8),
		            name: ctx.session.name,
		            connection:(ctx.session.numOrPhon).replace(/[^a-zа-яё0-9\s]/gi, ' '),
		            text:(ctx.session.TextOrder).replace(/[^a-zа-яё0-9,.\s]/gi, ' '),
		            status:"created",
                AdminError:'',
                time:date.format(new Date(), 'DD.MM.YYYY HH:mm')
              };//создание новой заявки
                clients.updateOne({TgName: '@'+ctx.message.chat.username}, {$push:{order:{$each:[order],$position:0,$slice:1}}})//добавление новой заявки

        } else {
          console.error(err);
        }
      });
      }
      connectMongoDB();

    await ctx.telegram.sendMessage(ADMIN_CHAT_ID,ctx.session.EndOrder,{parse_mode: "MarkdownV2"});
    ctx.scene.leave()
  } else if((ctx.session.textCaptcha).toUpperCase() == 'ОТМЕНА'){
    await ctx.reply(`Заявка отменена`);
  await ctx.scene.leave()
  } else {
    ctx.telegram.deleteMessage(ctx.chat.id,ctx.message.message_id)
    ctx.telegram.deleteMessage(ctx.chat.id,ctx.message.message_id-1)
    ctx.scene.enter('cap');
  }
});
  return cap
}

OrderInfo(){
  const orderinfo = new Scenes.BaseScene('orderinfo');
  orderinfo.enter(async (ctx) => {
  mongoClient.connect(async function(error, mongo) {
    if (!error) {
          let db = mongo.db('TgNormotors');// подключение к бд
          let clients = db.collection('clients');//подключение коллеуции
          let order = await clients.findOne({TgName: '@'+ctx.message.chat.username});
         if(order == null||'order.0' == null){
          ctx.replyWithHTML(`Вы еще не подавали заявку на обратную связь! Используйте /order`);
         } else if((order.order[0].AdminError != "")&&(order.order[0].status == "Error")){
          ctx.replyWithHTML(
`Мы не смогли связаться с вами, <i>сообщение от оператора:</i>
<b>${order.order[0].AdminError}</b>
`);
         } else if(order.order[0].status == "created"){
          ctx.replyWithHTML(
`Ваша заявка отправлена но еще не обраюотана. В скором времени наш оператор обработает вашу заявку!
<i>Если статус заявки не меняется уже на протяжении часа, отправьте заявку повторно!</i>
`);
         } else if (order.order[0].status == "postponed"){
          ctx.replyWithHTML(
`Ваша заявка уже обрабатывается оператором!
<i>Если статус заявки не меняется уже на протяжении часа, отправьте заявку повторно!</i>
`)
         } else if (order.order[0].status == "done") {
          ctx.replyWithHTML(
`<b>Ваша заявка была выполнена! Можете отправить новую заявку /order</b>
`)
         }

    } else {
      console.error(err);
    }
  });
  });
  return orderinfo
}

//=====================================================================
//=====================================================================
}
module.exports = SceneGenerator
