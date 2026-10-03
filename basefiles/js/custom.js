/**生成圆圈编号，01,02,03，。。。。10,11,12**/
   function padding(num, length) {
    for (var len = (num + "").length; length > len; len = num.length) {
        num = "0" + num;
    }
    return num;
}

function custTopic() {
    var parents = document.getElementsByName("cust-num")
    for (var i = 0; parents.length > i; i++) {
        var childs = parents[i].getElementsByTagName("li")
        var index = 1
        for (var j = 0; childs.length > j; j++) {
            if (childs[j].parentNode != parents[i]){
                continue
            }
            var cust = "<span>" + padding(index++, 2) + "</span>" + childs[j].innerHTML
            childs[j].innerHTML = cust
        }
    }
}

function anotator(){
    var url = window.location.href;

    if(url.indexOf('viewer.jsp?file')>0){
        var htmlPath = url.substring(url.indexOf('file=')+'file='.length,url.length);
        window.location.href = '/imeWeb/'+ htmlPath;
    }else{
        var htmlPath = url.substring(url.indexOf('/imeWeb/')+'/imeWeb/'.length,url.length);
        var href = '/imeWeb/pdfViewer/web/viewer.jsp?file='+htmlPath;
        window.location.href=href;
    }

}

function initAnotator(){
    var url = window.location.href;
    if(url.indexOf('http')!=0 || url.indexOf('manual')>0){
        console.log('不是服务器PC打开');
        return;
    }
    var toolbarDiv = document.createElement('p');
    toolbarDiv.setAttribute('class','toolbar');
    toolbarDiv.style.width='16px';
    toolbarDiv.style.top='1px';
    toolbarDiv.style.left='95%';
    toolbarDiv.style.position='absolute';
    var anotatorEle = document.createElement('img');
    anotatorEle.src="/imeWeb/pdfViewer/web/css/feather2_icon.png";
    anotatorEle.style.width='16px';
    anotatorEle.title="批注";
    anotatorEle.addEventListener("click", function(){
        anotator();
    });
    document.body.appendChild(toolbarDiv);
    toolbarDiv.appendChild(anotatorEle);
}

setTimeout(function(){initAnotator();},500);