/**
 * 名人名言库（2026-10-19 每日视图用）—— 静态模块而不是 data/*.json：
 * 浏览器里 `import json` 需要 import-assertion（Safari 老版不支持），而且这句
 * 名言要在**无网络的落地面板**上立刻渲染，不该有一次 fetch。
 * 形状：{ zh: [[text, author], ...], en: [[text, author], ...] }
 */
export const QUOTES = {
 "zh": [
  [
   "学而不思则罔，思而不学则殆。",
   "孔子"
  ],
  [
   "路漫漫其修远兮，吾将上下而求索。",
   "屈原"
  ],
  [
   "博学之，审问之，慎思之，明辨之，笃行之。",
   "《中庸》"
  ],
  [
   "不积跬步，无以至千里；不积小流，无以成江海。",
   "荀子"
  ],
  [
   "纸上得来终觉浅，绝知此事要躬行。",
   "陆游"
  ],
  [
   "天下事有难易乎？为之，则难者亦易矣。",
   "彭端淑"
  ],
  [
   "苟日新，日日新，又日新。",
   "《礼记》"
  ],
  [
   "知己知彼，百战不殆。",
   "孙子"
  ],
  [
   "三人行，必有我师焉。",
   "孔子"
  ],
  [
   "路遥知马力，日久见人心。",
   "谚语"
  ],
  [
   "读书破万卷，下笔如有神。",
   "杜甫"
  ],
  [
   "会当凌绝顶，一览众山小。",
   "杜甫"
  ],
  [
   "长风破浪会有时，直挂云帆济沧海。",
   "李白"
  ],
  [
   "天生我材必有用，千金散尽还复来。",
   "李白"
  ],
  [
   "海纳百川，有容乃大。",
   "林则徐"
  ],
  [
   "苟利国家生死以，岂因祸福避趋之。",
   "林则徐"
  ],
  [
   "横眉冷对千夫指，俯首甘为孺子牛。",
   "鲁迅"
  ],
  [
   "其实地上本没有路，走的人多了，也便成了路。",
   "鲁迅"
  ],
  [
   "时间就像海绵里的水，只要愿挤，总还是有的。",
   "鲁迅"
  ],
  [
   "为中华之崛起而读书。",
   "周恩来"
  ],
  [
   "面壁十年图破壁，难酬蹈海亦英雄。",
   "周恩来"
  ],
  [
   "星星之火，可以燎原。",
   "毛泽东"
  ],
  [
   "雄关漫道真如铁，而今迈步从头越。",
   "毛泽东"
  ],
  [
   "一万年太久，只争朝夕。",
   "毛泽东"
  ],
  [
   "务实与不求甚解是两回事。",
   "竺可桢"
  ],
  [
   "独立之精神，自由之思想。",
   "陈寅恪"
  ],
  [
   "大胆的假设，小心的求证。",
   "胡适"
  ],
  [
   "宁鸣而死，不默而生。",
   "范仲淹"
  ],
  [
   "先天下之忧而忧，后天下之乐而乐。",
   "范仲淹"
  ],
  [
   "不以物喜，不以己悲。",
   "范仲淹"
  ],
  [
   "生当作人杰，死亦为鬼雄。",
   "李清照"
  ],
  [
   "问渠那得清如许，为有源头活水来。",
   "朱熹"
  ],
  [
   "等闲识得东风面，万紫千红总是春。",
   "朱熹"
  ],
  [
   "山重水复疑无路，柳暗花明又一村。",
   "陆游"
  ],
  [
   "众里寻他千百度，蓦然回首，那人却在灯火阑珊处。",
   "辛弃疾"
  ],
  [
   "了却君王天下事，赢得生前身后名。",
   "辛弃疾"
  ],
  [
   "莫等闲，白了少年头，空悲切。",
   "岳飞"
  ],
  [
   "精诚所至，金石为开。",
   "王充"
  ],
  [
   "工欲善其事，必先利其器。",
   "孔子"
  ],
  [
   "岁寒，然后知松柏之后凋也。",
   "孔子"
  ],
  [
   "知之者不如好之者，好之者不如乐之者。",
   "孔子"
  ],
  [
   "敏而好学，不耻下问。",
   "孔子"
  ],
  [
   "千里之行，始于足下。",
   "老子"
  ],
  [
   "上善若水，水善利万物而不争。",
   "老子"
  ],
  [
   "大直若屈，大巧若拙，大辩若讷。",
   "老子"
  ],
  [
   "祸兮福之所倚，福兮祸之所伏。",
   "老子"
  ],
  [
   "吾生也有涯，而知也无涯。",
   "庄子"
  ],
  [
   "君子之交淡若水，小人之交甘若醴。",
   "庄子"
  ],
  [
   "吾不能变心而从俗兮，固将愁苦而终穷。",
   "屈原"
  ],
  [
   "老骥伏枥，志在千里；烈士暮年，壮心不已。",
   "曹操"
  ],
  [
   "捐躯赴国难，视死忽如归。",
   "曹植"
  ],
  [
   "非淡泊无以明志，非宁静无以致远。",
   "诸葛亮"
  ],
  [
   "鞠躬尽瘁，死而后已。",
   "诸葛亮"
  ],
  [
   "盛年不重来，一日难再晨。",
   "陶渊明"
  ],
  [
   "及时当勉励，岁月不待人。",
   "陶渊明"
  ],
  [
   "欲穷千里目，更上一层楼。",
   "王之涣"
  ],
  [
   "沉舟侧畔千帆过，病树前头万木春。",
   "刘禹锡"
  ],
  [
   "天变不足畏，祖宗不足法，人言不足恤。",
   "王安石"
  ],
  [
   "为者常成，行者常至。",
   "《晏子春秋》"
  ],
  [
   "绳锯木断，水滴石穿。",
   "罗大经"
  ],
  [
   "风声雨声读书声，声声入耳；家事国事天下事，事事关心。",
   "顾宪成"
  ],
  [
   "天下兴亡，匹夫有责。",
   "顾炎武"
  ],
  [
   "海到无边天作岸，山登绝顶我为峰。",
   "林则徐"
  ],
  [
   "笨鸟先飞早入林。",
   "谚语"
  ],
  [
   "只要功夫深，铁杵磨成针。",
   "谚语"
  ],
  [
   "宝剑锋从磨砺出，梅花香自苦寒来。",
   "谚语"
  ],
  [
   "少壮不努力，老大徒伤悲。",
   "《长歌行》"
  ],
  [
   "人无远虑，必有近忧。",
   "孔子"
  ],
  [
   "己所不欲，勿施于人。",
   "孔子"
  ],
  [
   "三人行，必有我师。",
   "孔子"
  ],
  [
   "逝者如斯夫，不舍昼夜。",
   "孔子"
  ],
  [
   "道虽迩，不行不至；事虽小，不为不成。",
   "荀子"
  ],
  [
   "锲而不舍，金石可镂。",
   "荀子"
  ],
  [
   "临渊羡鱼，不如退而结网。",
   "《汉书》"
  ],
  [
   "志不强者智不达。",
   "墨子"
  ],
  [
   "燕雀安知鸿鹄之志哉。",
   "陈胜"
  ],
  [
   "人生自古谁无死，留取丹心照汗青。",
   "文天祥"
  ],
  [
   "风萧萧兮易水寒，壮士一去兮不复还。",
   "荆轲"
  ],
  [
   "王侯将相，宁有种乎。",
   "陈胜"
  ],
  [
   "天行健，君子以自强不息。",
   "《周易》"
  ],
  [
   "地势坤，君子以厚德载物。",
   "《周易》"
  ],
  [
   "满招损，谦受益。",
   "《尚书》"
  ],
  [
   "与朋友交，言而有信。",
   "子夏"
  ]
 ],
 "en": [
  [
   "The only true wisdom is in knowing you know nothing.",
   "Socrates"
  ],
  [
   "I have not failed. I've just found 10,000 ways that won't work.",
   "Thomas Edison"
  ],
  [
   "The best way to predict the future is to invent it.",
   "Alan Kay"
  ],
  [
   "Stay hungry, stay foolish.",
   "Steve Jobs"
  ],
  [
   "Innovation distinguishes between a leader and a follower.",
   "Steve Jobs"
  ],
  [
   "The greatest glory in living lies not in never falling, but in rising every time we fall.",
   "Nelson Mandela"
  ],
  [
   "The journey of a thousand miles begins with one step.",
   "Lao Tzu"
  ],
  [
   "What we know is a drop, what we don't know is an ocean.",
   "Isaac Newton"
  ],
  [
   "If I have seen further, it is by standing on the shoulders of giants.",
   "Isaac Newton"
  ],
  [
   "Imagination is more important than knowledge.",
   "Albert Einstein"
  ],
  [
   "Try not to become a man of success, but rather try to become a man of value.",
   "Albert Einstein"
  ],
  [
   "The important thing is not to stop questioning.",
   "Albert Einstein"
  ],
  [
   "It always seems impossible until it's done.",
   "Nelson Mandela"
  ],
  [
   "Education is the most powerful weapon which you can use to change the world.",
   "Nelson Mandela"
  ],
  [
   "Be the change that you wish to see in the world.",
   "Mahatma Gandhi"
  ],
  [
   "Live as if you were to die tomorrow. Learn as if you were to live forever.",
   "Mahatma Gandhi"
  ],
  [
   "The unexamined life is not worth living.",
   "Socrates"
  ],
  [
   "Know thyself.",
   "Ancient Greek aphorism"
  ],
  [
   "Fortune favors the bold.",
   "Virgil"
  ],
  [
   "Where there's a will, there's a way.",
   "Proverb"
  ],
  [
   "Simplicity is the ultimate sophistication.",
   "Leonardo da Vinci"
  ],
  [
   "Learning never exhausts the mind.",
   "Leonardo da Vinci"
  ],
  [
   "What's done is done.",
   "William Shakespeare"
  ],
  [
   "All the world's a stage.",
   "William Shakespeare"
  ],
  [
   "To be, or not to be, that is the question.",
   "William Shakespeare"
  ],
  [
   "The pen is mightier than the sword.",
   "Edward Bulwer-Lytton"
  ],
  [
   "Knowledge is power.",
   "Francis Bacon"
  ],
  [
   "Reading is to the mind what exercise is to the body.",
   "Joseph Addison"
  ],
  [
   "A journey of a thousand miles must begin with a single step.",
   "Lao Tzu"
  ],
  [
   "Success is not final, failure is not fatal: it is the courage to continue that counts.",
   "Winston Churchill"
  ],
  [
   "We make a living by what we get, but we make a life by what we give.",
   "Winston Churchill"
  ],
  [
   "The only thing we have to fear is fear itself.",
   "Franklin D. Roosevelt"
  ],
  [
   "Ask not what your country can do for you — ask what you can do for your country.",
   "John F. Kennedy"
  ],
  [
   "In the middle of difficulty lies opportunity.",
   "Albert Einstein"
  ],
  [
   "Whether you think you can or you think you can't, you're right.",
   "Henry Ford"
  ],
  [
   "Quality means doing it right when no one is looking.",
   "Henry Ford"
  ],
  [
   "The secret of getting ahead is getting started.",
   "Mark Twain"
  ],
  [
   "The two most important days in your life are the day you are born and the day you find out why.",
   "Mark Twain"
  ],
  [
   "Twenty years from now you will be more disappointed by the things you didn't do than by the ones you did.",
   "Mark Twain"
  ],
  [
   "First, solve the problem. Then, write the code.",
   "John Johnson"
  ],
  [
   "Talk is cheap. Show me the code.",
   "Linus Torvalds"
  ],
  [
   "Programs must be written for people to read, and only incidentally for machines to execute.",
   "Harold Abelson"
  ],
  [
   "Premature optimization is the root of all evil.",
   "Donald Knuth"
  ],
  [
   "Simple things should be simple, complex things should be possible.",
   "Alan Kay"
  ],
  [
   "The best time to plant a tree was 20 years ago. The second best time is now.",
   "Proverb"
  ],
  [
   "Fall seven times, stand up eight.",
   "Japanese Proverb"
  ],
  [
   "A smooth sea never made a skilled sailor.",
   "Franklin D. Roosevelt"
  ],
  [
   "It does not matter how slowly you go as long as you do not stop.",
   "Confucius"
  ],
  [
   "Everything has beauty, but not everyone sees it.",
   "Confucius"
  ],
  [
   "Our greatest glory is not in never falling, but in rising every time we fall.",
   "Confucius"
  ]
 ]
};
