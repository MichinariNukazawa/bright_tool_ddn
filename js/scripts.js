// 初期化
var src_image;
var src_canvas, src_ctx;	// ソース画像
var imagename;				// ソース画像ファイル名
var thumb_src_data;			// 縮小ソース画像data
var dst_w, dst_h;			// 縮小ソース画像=表示用サムネイル(サイズ)
var thumb_dst_canvas, thumb_dst_ctx;	// 表示用サムネイル

var is_chroma = true;

window.onload = function(){

	src_image = new Image();

	// プレビュー画像 canvas(preview_canvas)
	thumb_dst_canvas = document.getElementById('thumb_canvas');
	if ( ! thumb_dst_canvas || ! thumb_dst_canvas.getContext ) {
		return false;
	}
	thumb_dst_ctx = thumb_dst_canvas.getContext('2d');

	// コールバックの設定
	// 画像読み込み時のコールバックをセット
	src_image.onload = function(){
		// 画像情報をセット
		reset_image();

		// スライダを初期化
		init_slider();
	};

	// デフォルト画像を読み込む
	src_image.src = "default_800x600.jpg";
}

// ダウンロード・リンク
function cb_download(){
	console.log("ref");

	// 加工後画像用Canvasを生成
	var dst_canvas = document.createElement('canvas');
	dst_canvas.width = src_image.width;
	dst_canvas.height = src_image.height;
	var dst_ctx = dst_canvas.getContext('2d');

	// 画像を加工
	var value = $('#input_brightness').val();
	var obj_brightness = new Brightness(src_image.width, src_image.height,
			true, '', value, false,
			function (buffer) {
			var chroma_value = ((is_chroma) ? Math.abs(value):0);
			chroma_value *= 4;
			chroma_value = ((chroma_value < 255) ? chroma_value: 255);
			console.log("chroma:" + chroma_value);
			var obj_chroma = new Chroma(src_image.width, src_image.height,
				true, '', chroma_value, false,
				function (c_buffer){
				updateCanvas(dst_ctx, dst_ctx.createImageData(src_image.width, src_image.height), c_buffer);


				if (typeof imagename === "undefined"){
				imagename = 'unknown';
				}
				var download_filename = imagename + "_" + value + '.jpg';


				try{
				var dst_blob = getBlobFromCanvas( dst_canvas);
				//var url = dst_canvas.toDataURL('image/jpeg');
				$("#download_link").attr("download", download_filename);
				//	$("#download_link").attr("href", url);
				//	$("#download_link").attr("href", dst_canvas.toDataURL('image/jpeg'));
				$("#download_link").attr("href",window.URL.createObjectURL( dst_blob));
				} catch (e){
					console.log("download error");
				}
				});
			obj_chroma.chroma(buffer);
			});
	var data = src_ctx.getImageData(0, 0, src_image.width, src_image.height).data;
	obj_brightness.brightness(data);
}

// CanvasからBlobを生成する
function getBlobFromCanvas(canvas){
	var dataUrl = canvas.toDataURL("image/jpeg");
	var bin = atob(dataUrl.split("base64,")[1]);
	var len = bin.length;
	var barr = new Uint8Array(len);
	for(var i = 0; i<len; i++){
		barr[i] = bin.charCodeAt(i);
	}
	return new Blob([barr.buffer], {type: "image/jpeg"});
}

// スライダを初期化 コールバックを設定
function init_slider(){
	$(function() {
		$('#slider_brightness').slider({
			min: -20,
			max: 30,
			step: 2,
			value: 0,
			// スライダーの初期化時に、その値をテキストボックスにも反映
			create: function(e, ui) {
			$('#input_brightness').val($(this).slider('option', 'value'));
			draw_thumb();
			},
			// スライダーの変化時にテキストボックスの値表示を更新
			change: function(e, ui) {
			$('#input_brightness').val(ui.value);
			draw_thumb();
			},
			// スライド中に変化を取得する
			slide: function(e, ui) {
			$('#input_brightness').val($(this).slider('option', 'value'));
			draw_thumb();
			}
		});
	});
}

// src_imageの画像をソース画像としてCanvasなどにセットする
function reset_image() {
	// console.log('reset_image');

	// ソース画像
	src_canvas = document.createElement('canvas');
	src_canvas.width = src_image.width;
	src_canvas.height = src_image.height;
	src_ctx = src_canvas.getContext('2d');

	src_ctx.drawImage(src_image, 0, 0);
	
	// サムネイル領域を塗りつぶす
	thumb_dst_ctx.clearRect(0, 0, thumb_dst_canvas.width, thumb_dst_canvas.height);

	// サムネイルCanvasサイズから、変換後画像サイズを算出
	// FIXME:縦横比を維持できる画像サイズを計算する！
	var sw = src_image.width;
	var sh = src_image.height;
	if ( sw > sh ){
		var ratio = (thumb_dst_canvas.width - 4)/sw;
	}else{
		var ratio = (thumb_dst_canvas.height - 4)/sh;
	}
	dst_w = sw * ratio;
	dst_h = sh * ratio;

	thumb_dst_ctx.fillstyle = 'rgba(196, 196, 196)';
	thumb_dst_ctx.fillRect(0, 0, (dst_w + 4), (dst_h + 4));
	// tyle = 'rgba(192, 80, 77, 0.7)'

	// 縮小ソース画像データを作成
	var dataToScale = src_ctx.getImageData(0, 0, src_image.width, src_image.height).data;
	var resized = new Resize(src_image.width, src_image.height, dst_w, dst_h,
			true, true, false,
			function (buffer) {
			thumb_src_data = buffer;
			});
	resized.resize(dataToScale);
	console.log('resize');
}

function draw_thumb(){
	// console.log('draw_thumb()');
	// FIXME: 現在のCanvasと縮小サムネイル画像のサイズが合っていることを確認する
	var value = $('#input_brightness').val();
	// 表示サムネイルを描画
	var obj_brightness = new Brightness(dst_w, dst_h,
			true, '', value, false,
			function (buffer) {
			var chroma_value = ((is_chroma) ? Math.abs(value):0);
			chroma_value *= 4;
			chroma_value = ((chroma_value < 255) ? chroma_value: 255);
			console.log("chroma:" + chroma_value);
			var obj_chroma = new Chroma(dst_w, dst_h,
				true, '', chroma_value, false,
				function (c_buffer){
				updateCanvas(thumb_dst_ctx, thumb_dst_ctx.createImageData(dst_w, dst_h), c_buffer);
				});
			obj_chroma.chroma(buffer);
			});
	obj_brightness.brightness(thumb_src_data);
}

// アップロードされたファイルを、src_imageに代入する
function cb_file_select(_this, ev){
	console.log('cb_file_select()');

	// 選択されたファイルを取得
	var file = _this.files[0];
	// 画像ファイル以外は処理中止
	if (!file.type.match(/^image\/(bmp|png|jpeg|gif)$/)) return;

	// 画像ファイル名を保存
	imagename = unextension(file.name);

	// 画像ファイル読み込み関連のオブジェクト
	var reader = new FileReader();

	// File APIを使用し、ローカルファイルを読み込む
	reader.onload = function(evt) {
		// 画像のURLをソースに設定
		src_image.src = evt.target.result;
	}

	// ファイルを読み込み、データをBase64でエンコードされたデータURLにして返す
	reader.readAsDataURL(file);
}
function cb_chroma_support(_this, ev){
	if($('#checkbox_chroma').prop("checked")){
		is_chroma = true;
	}else{
		is_chroma = false;
	}
	draw_thumb();
}

// 画像date配列をCanvasに描画
function updateCanvas(contextHandlePassed, imageBuffer, frameBuffer) {
	var data = imageBuffer.data;
	var length = data.length;
	for (var x = 0; x < length; ++x) {
		data[x] = frameBuffer[x] & 0xFF;
	}
	contextHandlePassed.putImageData(imageBuffer, 2, 2);
}

// ファイル名を切り出す
function basename( path ) {
	console.log( "path:" + path);
	return path.replace(/\\/g,'/').replace( /.*\//, '' );
}
// 拡張子を取り除く
function unextension( path ) {
	console.log( "u path:" + path);
	return path.replace( /\..*?$/, '' );
}
