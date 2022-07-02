const {Telegraf, Markup, Scenes, session} = require('telegraf');
require('dotenv').config();
const BOT_TOKEN = process.env.BOT_TOKEN;
const ADMIN1 = process.env.ADMIN1;
const bot = new Telegraf(BOT_TOKEN);
//==========================================
const SceneGenerator = require('./Scenes');
const curScene = new SceneGenerator();
const StartOrder = curScene.StartOrder();
const СonnectionOrder = curScene.СonnectionOrder();
const TextOrder = curScene.TextOrder();
const CheckNumOrPhon = curScene.CheckNumOrPhon();
const ConnectionSelection = curScene.ConnectionSelection();
const CaptchaCheck = curScene.CaptchaCheck();
const OrderInfo = curScene.OrderInfo();
//--------------------------------------------------------------
const SceneGeneratorAdmin = require('./ScenesAdmin');
const AdminScene = new SceneGeneratorAdmin();
const Authentication = AdminScene.Authentication();
const AdminPanel = AdminScene.AdminPanel();
const AddAutoPart = AdminScene.AddAutoPart();
const DeleteAutoPart = AdminScene.DeleteAutoPart();
const ChangeAutoPart = AdminScene.СhangeAutoPart();
const ChangeAutoPartNext1 = AdminScene.ChangeAutoPartNext1();
const ChangeAutoPartNext2 = AdminScene.ChangeAutoPartNext2();
const NewImage = AdminScene.NewImage();
const FindAProduct = AdminScene.FindAProduct();
//--------------------------------------------------------------


const stage = new Scenes.Stage([StartOrder,СonnectionOrder,TextOrder,CheckNumOrPhon,ConnectionSelection,Authentication,
AdminPanel,AddAutoPart,CaptchaCheck,OrderInfo,DeleteAutoPart,ChangeAutoPart,ChangeAutoPartNext1,ChangeAutoPartNext2,NewImage,FindAProduct]);
bot.use(session());
bot.use(stage.middleware());



//==========================================
bot.start((ctx) => {
  if(ctx.update.message.from.username == ADMIN1){
    ctx.scene.enter('Aut');
    
  } else {
  ctx.replyWithHTML(`
Здравствуйте, ${ctx.message.from.first_name}, это бот автосервиса <b>"Нурмоторс!"</b>
Введите команду /help чтобы узнать функционал бота!
  `);
  }
});

bot.command('information', async (ctx) => {
  try{
     ctx.replyWithHTML(`
Автоцентр <b>«Нор Моторс»</b> основан в 1994 году. Создавая его, мы учли все аспекты эксплуатации автомобилей марки <b>Mercedes</b> и <b>BMW</b>.

Располагая широкой технической базой, опытом мастеров и автомехаников, мы обеспечиваем нашим клиентам <b>профессиональный</b> сервис.
В современных условиях автобизнеса мы стараемся выдерживать максимально низкие цены на услуги и запасные части.

К Вашим услугам <strong>малярный цех</strong>, площадью 700 кв. м., камера окраски <strong>Uzi Италия</strong>, грунты и краски <strong>"шпиц-хеккер"</strong>. Полный комплекс <strong>ремонта</strong>, ремонт и перетяжка салона, широкий спектр <strong>автостекол</strong>.

У нас только высококвалифицированные мастера с большим стажем работы. Каждый наш мастер лучший и у каждого своя специфика. Каждый наш клиент самый важный, и для нас не имеет значения, зачем Вы приехали: поменять масло или сделать капитальный ремонт двигателя. В любом случае, Вы получите <strong>профессиональный сервис</strong> и персональное внимание к Вам и Вашему автомобилю.

Имея за плечами 14 лет успешной работы, приятно осознавать, что те люди, которые поверили нам в начале нашего пути, не разочаровались в своём выборе и по-прежнему пользуются услугами <strong>автоцентра "Нор Моторс"</strong>

Мы работаем для того, чтобы Вы имели возможность выбирать лучшее и обеспечить своему автомобилю <strong>сервис высшего уровня</strong>.

<strong>Наш девиз: качественное обслуживание и в срок.</strong>
`
  )

  }catch (err) {console.log(err);}
});


bot.command('schedule', async (ctx) => {
ctx.replyWithHTML(`
Наш график работы без изменений -
<b>Пн-Вс с 8.00-20.00</b>

<b>Находимся по адресу</b> -
г. Ростов-на-Дону, ул. Сиверса, 12 "В"
Яндекс карты - https://yandex.ru/maps/-/CCU5QRDh8B
`);
});

bot.command('contacts', async (ctx) => {
ctx.replyWithHTML(`
<i>Звоните</i> - +7 (863) 303-41-10;
<i>Пишите</i> - siversaMG1@mail.ru;
`);
});

bot.command('website', async (ctx) => {
ctx.reply(`
Наш сайт -
https://siversa.ru/about
`);
});

bot.command('inst', async (ctx) => {
ctx.replyWithHTML(`
<i>Наш инстаграмм -</i>
https://www.instagram.com/nurmotors.rnd/
`);
});



bot.command('order', async (ctx) => {
ctx.scene.enter('order');
});


bot.command('orderinfo', async (ctx) => {
  ctx.scene.enter('orderinfo');
  });

bot.help((ctx) => {
ctx.replyWithHTML(`
<i>С помощью бота вы можете:</i>
/information - получтить основную информацию о компании;
/schedule - узнать график работы и адрес;
/contacts - получить информацию для связи в других порталах;
/website - получить ссылку на сайт;
/inst - получить ссылку на инстаграмм;
/order - оставить заявку на обратную связь;
/orderinfo - узнать статус заявки;
`)
});

bot.launch().then(res => {
  console.log('Bot started')
}).catch(err => console.log(err));
