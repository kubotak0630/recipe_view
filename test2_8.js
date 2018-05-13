
/*
window.addEventListener('load', eventWindowLoaded, false);

function eventWindowLoaded() {
  canvasApp();
}
*/

window.addEventListener('load', function(){canvasApp();}, false);

function canvasApp() {
 

  let recipe_list = [];

  //レイヤー1
  const canvas = document.createElement('canvas');//canvas作成
  canvas.width = 1980;//canvas横幅
  canvas.height = 800;//canvas高さ
 
  //css設定
  canvas.style.position = "absolute";
  canvas.style.zIndex = "0";

  document.body.appendChild(canvas);//ノードリストに登録
  const ctx = canvas.getContext('2d');//


  //const canvas = document.getElementById('canvas');
  //const ctx = canvas.getContext('2d');
  if (!canvas || !canvas.getContext) {
    return;
  }

  //レイヤー2
  const tip_canvas = document.createElement('canvas');//canvas作成
  tip_canvas.width = 1980;//canvas横幅
  tip_canvas.height = 800;//canvas高さ
  //css設定
  tip_canvas.style.position = "absolute";
  tip_canvas.style.zIndex = "1";  //レイヤー１より上に表示

  document.body.appendChild(tip_canvas);//ノードリストに登録
  const tip_ctx = tip_canvas.getContext('2d');

  //試しに文字描画
  tip_ctx.fillStyle = 'red';
  tip_ctx.fillRect(100, 100, 100, 200);

  let fileObj = document.getElementById("selfile");

  fileObj.addEventListener("change", (evt) => {
    let file = evt.target.files;
    //FileReaderの作成
    let reader = new FileReader();
    reader.readAsText(file[0]);

    /* readAsText() が終了後に呼び出される*/
    reader.onload = (evt) => {
      console.log('call reader onload');
      let data_json = JSON.parse(evt.target.result);
      console.log(data_json);
      drawScreen(data_json);
    };

  }, false);



  tip_canvas.addEventListener('mousemove', (evt) => {
  
    let rect = tip_canvas.getBoundingClientRect();
    //let rect = evt.target.getBoundingClientRect();
    let mousePos_x = evt.clientX - Math.floor(rect.left);
    let mousePos_y = evt.clientY - Math.floor(rect.top);

    var message = 'Mouse position X:' + mousePos_x + ', Y:' + mousePos_y;
    //var message = 'Mouse position X:' + evt.clientX + ', Y:' + evt.clientY;
    //let message = 'Mouse position X:' + rect.left + ', Y:' + rect.top;
    
    //var txt_w = ctx.measureText(message).width;  //テキストの幅を取得
    tip_ctx.clearRect(100, 300, 100+200, 300+60);
    tip_ctx.textBaseline = 'top';
    tip_ctx.font = '12pt "MSゴシック"';
    tip_ctx.fillStyle = 'black';
    tip_ctx.fillText(message, 100, 300);


    for (let elem of recipe_list) {
      tip_ctx.clearRect(100, 400, 100+200, 400+60);
      tip_ctx.font = '12pt "MSゴシック"';
      tip_ctx.fillStyle = 'black';
      let obj = elem.is_mouse_inside_cmd(mousePos_x, mousePos_y);
      if (obj.flg) {
        tip_ctx.fillText('bingo, ' + obj.cmd , 100, 400);
      }
      else {
        tip_ctx.fillText('no bingo', 100, 400);
      }

    }

    
  
   }, false);



  class MainRecipe_C {
    constructor(recipe_name, nand_model = null) {
      this._recipe_name = recipe_name;
      this._start_x = 0;
      this._start_y = 0;
      this._nand_model = nand_model;
    }

    set_start_pos(pos_x, pos_y) {
      this._start_x = pos_x;
      this._start_y = pos_y;
      this._now_x = pos_x;

    }

    //描画後の座標Xを返す
    draw() {

      //幅は40, RBnを半分の20でHiにするだけ
      if (this._recipe_name == 'JZ') {
        this._now_x += 20;
        this._nand_model.draw_RBn(this._now_x);

        this._nand_model.finish_busy();
        this._now_x += 20;
        this._nand_model.draw_RBn(this._now_x);

        this._drawRecipeName(this._recipe_name, this._start_x, this._start_y, this._now_x - this._start_x , false);

        return this._now_x;
      }
      
    }

    _drawRecipeName(str, pos_x, pos_y, size_x, subrecipe_flg = true) {

      ctx.lineWidth = 1;
      const size_y = 20;
  
      //ctx.fillStyle = 'white';
      //ctx.fillStyle = 'rgb(255,222,140)';  //ひまわり色
      if (subrecipe_flg) {
        ctx.fillStyle = 'rgb(230,230,220)';  
      }
      else {
        ctx.fillStyle = 'rgb(230,200,230)';  
      }
      
      ctx.fillRect(pos_x, pos_y, size_x ,size_y);
      ctx.strokeRect(pos_x, pos_y, size_x , size_y);
   
      //文字の描画
      ctx.textBaseline = 'middle';
      ctx.font = '9pt Arial';
      ctx.fillStyle = 'black';
  
      //テキストの幅を取得
      const txt_w = ctx.measureText(str).width;
      ctx.fillText(str, pos_x + (size_x - txt_w) / 2, pos_y + size_y/2);
    }

  }

  class Subrecipe_C {

    constructor(recipe_name, nand_model = null) {
      this._recipe_name = recipe_name;
      this._cmd_seq = [];  //オブジェクト{type: 'xxx', val: 'xxx'}のリスト
      this._start_x = 0;
      this._now_x = 0;
      this._dq_pos_y = 0;
      this._start_space = 0;  //最初の余白
      this._end_space = 0;  //最後の余白
      this._nand_model = nand_model;
      this._cmd_pos_list = []; //オブジェクト {cmd:'D5', x:, y:, size_x:, size_y:} のリスト, toolTipで座標判定に利用
    }

    set_start_pos(pos_x, pos_y) {
      this._start_x = pos_x;
      this._start_y = pos_y;
      this._now_x = pos_x;

      this._dq_pos_y = pos_y + 50;
    }

    set_space(start_space, end_space) {
      this._start_space = start_space;
      this._end_space = end_space;
    }

    set_cmd(type, val, notes = '') {
      this._cmd_seq.push({type: type, val: val, notes: notes});
    }

    is_mouse_inside_cmd(mouse_x, mouse_y) {

      let ret_obj = {flg: false, cmd: ''};

      if (this._cmd_pos_list.length < 1) {
        return ret_val;
      }
      for (let elem of this._cmd_pos_list) {
 
        ctx.beginPath();
        //右上から
        ctx.moveTo(elem.x + elem.size_x, elem.y);
        ctx.quadraticCurveTo(elem.x + elem.size_x + elem.delta, elem.y + elem.size_y/2, elem.x + elem.size_x, elem.y + elem.size_y);
        ctx.lineTo(elem.x, elem.y + elem.size_y);
      
        ctx.quadraticCurveTo(elem.x - elem.delta, elem.y + elem.size_y/2, elem.x, elem.y);
  
        ctx.closePath();

        ret_obj.flg = ctx.isPointInPath(mouse_x, mouse_y);
        if (ret_obj.flg) {
          ret_obj.cmd = elem.cmd;
          break;
        }
      }     
      return ret_obj;
    }
    //描画後の座標Xを返す
    draw() {
      

      //DQの線を長めに描いて最後に消す
      this._drawLine(this._start_x, this._dq_pos_y + 10, 1000);

      //最初の余白
      this._now_x += this._start_space;
      
      if (this._nand_model) {
        this._nand_model.draw_RBn(this._now_x);
      }
      
      let pre_cmd = '';
      for (let elem of this._cmd_seq) {

        //アドレスとライトデータの間は隙間を空ける(リードデータはBusyの後に隙間があくので必要なし)
        if (pre_cmd == 'ADR' && elem.type == 'WDATA') {
          this._now_x += 20;
        }
        else if (pre_cmd == 'CMD' && elem.type == 'RDATA') {
          this._now_x += 10;
        }
        //コマンドとアドレス
        else if (pre_cmd == 'CMD' && elem.type == 'ADR') {
          this._now_x += 10;
        }
        else if (pre_cmd == 'ADR' && elem.type == 'CMD') {
          this._now_x += 20;
        }

        pre_cmd = elem.type;

        //DQ描画
        if (elem.type == 'CMD') {
          this._now_x += this._drawCmd(elem.val, this._now_x, this._dq_pos_y);
        }
        else if (elem.type == 'ADR') {
          this._now_x += this._drawAddr(elem.val, this._now_x, this._dq_pos_y, elem.notes);
        }
        else if (elem.type == 'WDATA' || elem.type == 'RDATA') {
          this._now_x += this._drawData(elem.val, this._now_x, this._dq_pos_y, elem.notes);
        }

        //RBnの描画
        if (this._nand_model) {
          this._nand_model.set_cmd(elem.type, elem.val);
          let busy_time = this._nand_model.draw_RBn(this._now_x);
          this._now_x += busy_time;
        }
        
      }


      //最後の余白
      this._now_x += this._end_space;

      if (this._nand_model) {
        this._nand_model.draw_RBn(this._now_x);
      }
      

      this._drawRecipeName(this._recipe_name, this._start_x, this._start_y, this._now_x - this._start_x);

      //余分なDQの線を消す
      ctx.clearRect(this._now_x, this._dq_pos_y, 1010-(this._now_x-this._start_x), 40);
      

      return this._now_x;

    }

    _drawLine(pos_x, pos_y, width) {
      
      ctx.beginPath();
      ctx.moveTo(pos_x, pos_y);
      ctx.lineTo(pos_x + width, pos_y);

      ctx.lineWidth = 1;
      ctx.strokeStyle = 'black';
      ctx.stroke();
    }

    _drawData(str, pos_x, pos_y, notes = '') {

      ctx.lineWidth = 1;
      const size_x = 24;
      const size_y = 20;
      const delta = 6;
  
      ctx.beginPath();
      ctx.moveTo(pos_x, pos_y + size_y/2);
      ctx.lineTo(pos_x + delta, pos_y);
      ctx.lineTo(pos_x + delta + size_x, pos_y);
      ctx.lineTo(pos_x + delta*2 + size_x, pos_y + size_y/2);
      ctx.lineTo(pos_x + delta + size_x, pos_y + size_y);
      ctx.lineTo(pos_x + delta, pos_y + size_y);
      ctx.closePath();

      ctx.fillStyle = 'white';
      ctx.strokeStyle = 'black';
      
      ctx.fill();
      ctx.stroke();
      
  
      //文字の描画
      ctx.textBaseline = 'middle';
      ctx.font = '10pt Arial';
      ctx.fillStyle = 'black';

      const txt_w = ctx.measureText(str).width;  //テキストの幅を取得
      ctx.fillText(str, pos_x + (size_x + (delta * 2) - txt_w) / 2, pos_y + size_y/2);

      //コメントを表示
      if (notes) {
        ctx.textBaseline = 'top';
        ctx.font = '8pt Arial';
        ctx.fillText(notes, pos_x + 5, pos_y + size_y + 5);
      }

      return size_x + delta * 2;
  
    }

    _drawAddr(str, pos_x, pos_y, notes = '') {

      ctx.lineWidth = 1;
      const size_x = 36;
      const size_y = 20;
  
      //ctx.fillStyle = 'white';
      ctx.fillStyle = 'rgb(255,222,140)';  //ひまわり色
      ctx.strokeStyle = 'black';
      ctx.fillRect(pos_x, pos_y, size_x, size_y);
      ctx.strokeRect(pos_x, pos_y, size_x, size_y);
  
      //文字の描画
      ctx.textBaseline = 'middle';
      ctx.font = '9pt Arial';
      ctx.fillStyle = 'black';
  
      //テキストの幅を取得
      const txt_w = ctx.measureText(str).width;
  
      ctx.fillText(str, pos_x + (size_x - txt_w) / 2, pos_y + size_y/2);
  
      //コメントを表示
      if (notes) {
        ctx.textBaseline = 'top';
        ctx.font = '8pt Arial';
        ctx.fillText(notes, pos_x + 5, pos_y + size_y + 5);
      }

      return size_x;
    }

    _drawCmd(str, pos_x, pos_y) {

      ctx.lineWidth = 1;
  
      const size_x = 28;
      const size_y = 20;
      const delta = 12;  //丸い曲線の量
      const obj_width = 42; //size_xとdeltaでオブジェクトの幅が決まるが正確な数式はない
  
      ctx.beginPath();
      
      //右上から
      ctx.moveTo(pos_x + size_x, pos_y);
      
      ctx.quadraticCurveTo(pos_x + size_x + delta, pos_y + size_y/2, pos_x + size_x, pos_y + size_y);
      ctx.lineTo(pos_x, pos_y + size_y);
      
      ctx.quadraticCurveTo(pos_x - delta, pos_y + size_y/2, pos_x, pos_y);
  
      ctx.closePath();
  
      ctx.strokeStyle = 'black';
      //ctx.fillStyle = 'cornflowerblue';
      ctx.fillStyle = 'rgb(147,179,234)'; //cornflowerblueより少し彩度が低い
      ctx.fill();    
      ctx.stroke();
  
      //文字の描画
      ctx.textBaseline = 'middle';
      ctx.font = '12pt Arial';
      ctx.fillStyle = 'black';
  
      const txt_w = ctx.measureText(str).width;  //テキストの幅を取得
      ctx.fillText(str, pos_x + (size_x - txt_w) / 2, pos_y + size_y/2);

      //Tool Tipのために座標をリストに保持
      this._cmd_pos_list.push({cmd:str, x:pos_x, y:pos_y, size_x:size_x, size_y:size_y, delta:delta});

      return obj_width;
    }

    _drawRecipeName(str, pos_x, pos_y, size_x, subrecipe_flg = true) {

      ctx.lineWidth = 1;
      const size_y = 20;
  
      //ctx.fillStyle = 'white';
      //ctx.fillStyle = 'rgb(255,222,140)';  //ひまわり色
      if (subrecipe_flg) {
        ctx.fillStyle = 'rgb(230,230,220)';  
      }
      else {
        ctx.fillStyle = 'rgb(230,200,230)';  
      }
      
      ctx.fillRect(pos_x, pos_y, size_x ,size_y);
      ctx.strokeRect(pos_x, pos_y, size_x , size_y);
   
      //文字の描画
      ctx.textBaseline = 'middle';
      ctx.font = '9pt Arial';
      ctx.fillStyle = 'black';
  
      //テキストの幅を取得
      const txt_w = ctx.measureText(str).width;
      ctx.fillText(str, pos_x + (size_x - txt_w) / 2, pos_y + size_y/2);
    }

  }

  class NandModel {
    constructor() {
      this._ready = 1;
      this._busy_time = 0;
      this._cmd_ary = [];
      this._pos_x = 0;
      this._pos_y = 0;
    }

    _is_nand_busy() {
      //set feattue
      if (this._cmd_ary.length >= 7) {
        //let tmp = this._cmd_ary.slice(0, this._cmd_ary.length);
        let tmp = this._cmd_ary.slice(this._cmd_ary.length-7, this._cmd_ary.length);

        if (tmp[0].type == 'CMD' && tmp[0].val == 'D5' &&
        tmp[1].type == 'ADR' && tmp[2].type == 'ADR' &&
        tmp[3].type == 'WDATA' && tmp[4].type == 'WDATA' &&
        tmp[5].type == 'WDATA' && tmp[6].type == 'WDATA')

        this._ready = 0;
        this._busy_time = 50;
        this._cmd_ary = [];
      }
      //get feature
      if (this._cmd_ary.length >= 3) {
        //let tmp = this._cmd_ary.slice(0, this._cmd_ary.length);
        let tmp = this._cmd_ary.slice(this._cmd_ary.length-3, this._cmd_ary.length);
        if (tmp[0].type == 'CMD' && tmp[0].val == 'D6' && tmp[1].type == 'ADR' && tmp[2].type == 'ADR') {
          this._ready = 0;
          this._busy_time = 50;
          this._cmd_ary = [];
        }
      }

      if (this._cmd_ary.length >= 1) {
        let tmp = this._cmd_ary.slice(this._cmd_ary.length-1, this._cmd_ary.length);
        if (tmp[0].type == 'CMD' && tmp[0].val == 'D0') {
          this._ready = 0;
          this._busy_time = 1000;
          this._cmd_ary = [];
        }
      }
    }

    /** cmd_typ: 'CMD', 'ADR', 'WDATA'  */
    set_cmd(cmd_type, val) {
      let cmd_obj = {type: cmd_type, val: val};
      this._cmd_ary.push(cmd_obj);

      //Busyになるかを判定する
      this._is_nand_busy();

    }

  
    set_start_pos(pos_x, pos_y) {
      this._pos_x = pos_x;
      this._pos_y = pos_y;
      this._org_y = pos_y;
    }

    finish_busy() {
      
      ctx.beginPath();
      ctx.moveTo(this._pos_x, this._pos_y);
      ctx.lineTo(this._pos_x, this._org_y);

      ctx.lineWidth = 2;
      ctx.strokeStyle = 'black';
      ctx.stroke();

      this._ready = 1;
      this._pos_y = this._org_y;
    }
    
    draw_RBn(dst_x) {

      const size_y = 25;
      let ret_val = 0;

      ctx.beginPath();
      ctx.moveTo(this._pos_x, this._pos_y);

      
      ctx.lineTo(dst_x, this._pos_y);

      
      //READYをLoにして_busy_timeの期間Loでその後にHiにする
      if (this._ready == 0 && this._busy_time < 1000) {
        ctx.lineTo(dst_x, this._pos_y + size_y);
        ctx.lineTo(dst_x + this._busy_time, this._pos_y + size_y);
        ctx.lineTo(dst_x + this._busy_time, this._pos_y);
       
        this._pos_x = dst_x + this._busy_time;   
        this._ready = 1;
        ret_val = this._busy_time;
      }
      else if (this._ready == 0) {
        //READYがここでLoになるとき
        if (this._pos_y == this._org_y) {
          ctx.lineTo(dst_x, this._pos_y + size_y);
          this._pos_x = dst_x;
          this._pos_y += size_y;
          ret_val = 0;
        }
        //READYが既にLo
        else {
          ctx.lineTo(dst_x, this._pos_y);
          this._pos_x = dst_x;
          ret_val = 0;
        }
      }
      else {
        this._pos_x = dst_x;
        //this._pos_y = cmd_end_y;
      }

      ctx.lineWidth = 2;
      ctx.strokeStyle = 'black';
      ctx.stroke();

      return ret_val;
    }
  }



  function drawScreen(data_json) {
    
   
    console.log('debug hello');
     
    let nand_model = new NandModel();
   
    //let recipe_list = [];
    /**** Start SubRecipe *****/
    let recipe_pos_x = 150;
    let recipe_pos_y = 140;

    nand_model.set_start_pos(recipe_pos_x, recipe_pos_y +120);
  
    
    for (let k of Object.keys(data_json)) {
      let tmp = data_json[k];
      if (tmp['OPE'] == 'C_EXE' && tmp['NAND_DQ'] != '') {
        console.log('aaaa');

        //recipe_list = tmp['NAND_DQ'];
        let sub_rec_c = new Subrecipe_C(k, nand_model);
        recipe_list.push(sub_rec_c);

        for (let elem of tmp['NAND_DQ']) {
          sub_rec_c.set_cmd(elem['type'], elem['val'], elem['notes']);
        }

      }
    }
    

    for (let elem of recipe_list) {

      elem.set_start_pos(recipe_pos_x, recipe_pos_y);
      recipe_pos_x = elem.draw();
    }

    /** test */

    tip_ctx.fillStyle = 'blue';
    tip_ctx.fillRect(100, 150, 100 ,50);
    tip_ctx.clearRect(0, 0, 1000 ,500);
    

    
    
    /*
    let sub_rec_c = new Subrecipe_C('MULTI2_ERASE', nand_model);
    recipe_list.push(sub_rec_c);
   
    sub_rec_c.set_space(20, 20);

    sub_rec_c.set_cmd('CMD', '60');
    sub_rec_c.set_cmd('ADR', 'TAG', 'L2P_TAG[1]');
    sub_rec_c.set_cmd('ADR', 'TAG');
    sub_rec_c.set_cmd('ADR', 'TAG');
    sub_rec_c.set_cmd('CMD', '60');
    sub_rec_c.set_cmd('ADR', 'TAG', 'L2P_TAG[2]');
    sub_rec_c.set_cmd('ADR', 'TAG');
    sub_rec_c.set_cmd('ADR', 'TAG');
    sub_rec_c.set_cmd('CMD', 'D0');


    sub_rec_c = new Subrecipe_C('STATUS_RB_FXH', nand_model);
    recipe_list.push(sub_rec_c);
   
    sub_rec_c.set_space(20, 20);

    sub_rec_c.set_cmd('CMD', 'F1');
    sub_rec_c.set_cmd('RDATA', 'XX', 'hoge');

   
    for (let elem of recipe_list) {

      elem.set_start_pos(recipe_pos_x, recipe_pos_y);
      recipe_pos_x = elem.draw();
    }
    */
  
  }


}


