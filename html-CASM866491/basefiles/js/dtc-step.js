/** 电气诊断步骤数据 **/
var dtcStepsObject = {
	stepsData : [],
	addStep : function(step) {
		console.log('记录当前步骤：' + step);
		if (step === undefined || step === null || step === '') return;
		this.stepsData.push(step);
	},
	previousStep : function() {
		// 为空时返回 undefined 
		var step = this.stepsData.pop();
		console.log('回到上一步骤：' + step);
		return step;
	},
	clear : function() {
		this.stepsData = [];
	},
	className : 'dtc-inactive'
}

/** 隐藏电气诊断信息 **/
function hideDtcInfo(obj){
  console.log('隐藏data-step:' + obj.getAttribute('data-step') + ';data-option:' + obj.getAttribute('data-option'));
  var obj_class = ' ' + obj.className + ' '; //获取 class 内容.
  if (obj_class.match(' '+dtcStepsObject.className+' ') === null) {
	obj_class = obj.className;
	var blank = (obj_class !== '') ? ' ' : '';//判断获取到的 class 是否为空, 如果不为空在前面加个'空格'.
	var added = obj_class + blank + dtcStepsObject.className;//组合原来的 class 和需要添加的 class.
	obj.className = added;//替换原来的 class.
  }
}

/** 显示电气诊断信息 **/
function showDtcInfo(obj){
  console.log('显示data-step:' + obj.getAttribute('data-step') + ';data-option:' + obj.getAttribute('data-option'));
  var obj_class = ' '+obj.className+' ';//获取 class 内容, 并在首尾各加一个空格. ex) 'abc    bcd' -> ' abc    bcd '
  obj_class = obj_class.replace(/(\s+)/gi, ' ');//将多余的空字符替换成一个空格. ex) ' abc    bcd ' -> ' abc bcd '
  var removed = obj_class.replace(' '+dtcStepsObject.className+' ', ' ');//在原来的 class 替换掉首尾加了空格的 class. ex) ' abc bcd ' -> 'bcd '
  removed = removed.replace(/(^\s+)|(\s+$)/g, '');//去掉首尾空格. ex) 'bcd ' -> 'bcd'
  obj.className = removed;//替换原来的 class.
}

/** 回到上一步 **/
function gotoPreviousDtcStep() {
	var step = dtcStepsObject.previousStep();
	if (step !== undefined) {
		gotoDtcStep(step);
	}
}

/** 重新开始 **/
function gotoFirstDtcStep(step) {
	dtcStepsObject.clear();
	gotoDtcStep(step);
}

/**在当前页面中，切换到本锚点指定的步骤**/
function gotoDtcStep(step) {
	console.log('到步骤：' + step);
	if (step === undefined || step === '') {
		return;
	}
	var steps = document.getElementsByClassName("dtcprocess");
	for (var i = 0; i < steps.length; i++) {
		var data = steps[i].getAttribute('data-step');
		if (data === step) {
			showDtcInfo(steps[i]);
			var selectTags = steps[i].getElementsByTagName("SELECT");
			for (var j = 0; j < selectTags.length; j++) {
				// 初始化步骤选项
				selectTags[j][0].selected=true;
			}
		}else {
			hideDtcInfo(steps[i]);
		}
	}
}

function jumptoDtcStep(current_step, next_step) {
	dtcStepsObject.addStep(current_step);
	gotoDtcStep(next_step);
}

/** 按照当前步骤中的指定选项执行相关操作，包括跳到下一步、显示当前步骤中指定选项的相关信息 **/
function showDtcOptionOfStep(selectObj) {
	if (dtcStepsObject.bySystem) return;
	if (selectObj === null) return;
	var option = selectObj.value;
	if (option !== null && option.substr(0,5) === 'next-') {
		// 直接转到下一步
		var current_step = selectObj.getAttribute('data-current');
		dtcStepsObject.addStep(current_step);
		gotoDtcStep(option.substr(5));
		selectObj[0].selected=true;
		return;
	}
	if (selectObj.parentElement === null || selectObj.parentElement.parentElement === null || selectObj.parentElement.parentElement.parentElement === null 
		|| selectObj.parentElement.parentElement.parentElement.nextElementSibling === null){
		return;
	}
	// 显示当前步骤中指定选项的相关信息
	var div = selectObj.parentElement.parentElement.parentElement.nextElementSibling;
	var dtcOptions = div.getElementsByClassName("dtcstep");
	for (var i = 0; i < dtcOptions.length; i++) {
		var data = dtcOptions[i].getAttribute('data-option');
		if (data === option) {
			showDtcInfo(dtcOptions[i]);
		}else {
			hideDtcInfo(dtcOptions[i]);
		}
	}
}

/**切换到URL中锚点指定的步骤**/
window.onload = function initDtcStep() {
	var step = window.location.hash;
	if (step !== undefined && step !== '' && step !== '#') {
		gotoDtcStep(step.substring(1));
	}
}
