//保持光标在最后
function keepLastIndex(obj) {
    if (window.getSelection) {//ie11 10 9 ff safari
        obj.focus(); //解决ff不获取焦点无法定位问题
        var range = window.getSelection();//创建range
        range.selectAllChildren(obj);//range 选择obj下所有子内容
        range.collapseToEnd();//光标移至最后
    }
    else if (document.selection) {//ie10 9 8 7 6 5
        var range = document.selection.createRange();//创建选择对象
        //var range = document.body.createTextRange();
        range.moveToElementText(obj);//range定位到obj
        range.collapse(false);//光标移至最后
        range.select();
    }
}

/**
 * 设备序列编辑器
 * @param id 编号
 */
function deviceEditor(id, options) {

    var cookieName = 'tra_device_val_';

    //默认配置
    var settings = {
        name: 'deviceSn', //值控件的ID，目标值
        opType: '', //操作类型
        callback: function(values){} //输入序列号后的回调函数
    };

    $.extend(settings, options);

    $('#'+id).attr({contenteditable: true, spellcheck: false});
    $('#'+id).after('<div class="deviceEditorTools"><a id="btnDeviceClear" href="javascript:" title="清空所有"><i class="fa fa-remove"></i></a> <a id="btnDeviceSort" href="javascript:" title="按顺序排序"><i class="fa fa-sort-numeric-asc"></i></a></div>');
    $('#'+id).after('<input type="hidden" name="'+settings.name+'" id="'+id+'Value" />');

    var isSplit = false; //是否输入的是切分符

    //按下按键时
    $('#'+id).keydown(function(event){
        var keyCode = event.keyCode;
        console.log(keyCode);
        if(keyCode == 188 || keyCode == 229 || keyCode == 13){ //分别是,，回车
            isSplit = true;
        }else{
            isSplit = false;
        }
    });

    //重置设备标签
    function resetSns(text){
        var deviceSns = text.split(/[,，]/);
        var strHtml = '';
        var snCount = 0;
        var sns = [];
        for (var i = 0; i < deviceSns.length; i++) {
            if(deviceSns[i].length>0) {
                var sn = $.trim(deviceSns[i].replace('×', ''));
                if(sn.length>0){
                    strHtml += '<span class="label label-default" data-sn="' + sn + '" style="margin: 0px 5px;display: inline-block;">' + sn + ' <a href="javascript:void(0);" style="cursor: pointer;" title="移除"> × </a></span>,';
                    sns.push(sn);
                    snCount++;
                }
            }
        }
        $('#'+id).html(strHtml);
        $('#'+id + 'Count').text(snCount);
        $('#'+id + 'Value').val(sns);
        
        //移除点击事件
        removeLink();

        //保持光标在最后
        if(text.length>0) {
            keepLastIndex(document.getElementById(id));
        }

        //检查
        if(checkRepeat(sns)){
            checkDevice(sns);
        }

        //回调
        settings.callback(sns);
    }

    //重置设备标签
    this.resetText = function(){
        var text = $('#'+id).text();
        return resetSns(text);
    }

    //自动加载默认
    var oldSns = $.cookie(cookieName + settings.opType);
    if(undefined != oldSns){
        resetSns(oldSns);
    }

    //在输入时
    $('#'+id).bind('input', function(){
        var html = $(this).html();
        var text = $(this).text();
        console.log(text);

        if(isSplit && (text.charAt(text.length - 1)==',' || text.charAt(text.length - 1)=='，' || html.indexOf('<div><br></div>')>=0)){
            resetSns(text);
        }
    });

    //光标离开后把最后一个加span
    $('#'+id).blur(function() {
        var html = $(this).html();
        var text = $(this).text();

        if(text.charAt(text.length - 1)!=',' || text.charAt(text.length - 1)=='，' || html.indexOf('<div><br></div>')>=0){
            resetSns(text);
        }else{
            if(getRealCount(text.split(',')) != getRealCount($('#'+id + 'Value').val().split(','))){
                resetSns(text);
            }
        }
    });

    function getRealCount(sns) {
        var count = 0;
        for(var i=0;i<sns.length;i++){
            if(sns[i].length>0){
                count++;
            }
        }
        return count;
    }

    //检查设备序列号是否重复
    function checkRepeat(sns) {
        var deviceSns = sns;
        var repeatSns = [];
        var repeatSpan = [];
        repeatSns.length = 0;
        repeatSpan.length = 0;
        if(deviceSns.length > 1) {
            var snSpans = $('#'+id + ' span');
            $.each(snSpans, function(i, n){
                $.each(snSpans, function (i2, n2) {
                    var str1 = $(n).attr('data-sn');
                    var str2 = $(n2).attr('data-sn');
                    if (i2 > i && str1 == str2) {
                        repeatSpan.push(n2);
                        var isExist = false;
                        $.each(repeatSns, function (i3, n3) {
                            if(n3 == str2) isExist = true;
                        });
                        if(!isExist) repeatSns.push(str2);
                    }
                });
            });
        }

        if(repeatSns.length>0){
            $('#'+id + 'Error').html('，以下序列号有重复：' + repeatSns + ' <a href="javascript:" id="'+id+'RemoveRepeat"><i class="fa fa-trash-o"></i>移除重复项</a>');
            $('#'+id + 'Error').show();

            //鼠标移上去高亮显示对应的序列号
            $('#'+id + 'Error').unbind();
            $('#'+id + 'Error').hover(
                function () {
                    $.each(repeatSpan, function(i, n){
                        $(n).removeClass('label-default');
                        $(n).addClass('label-danger');
                    });
                },
                function () {
                    $('#'+id + ' span').removeClass('label-danger');
                    $('#'+id + ' span').addClass('label-default');
                }
            );

            //点击移除项
            $('#'+id+'RemoveRepeat').click(function () {
                $.each(repeatSpan, function(i, n){
                    $(n).remove();
                });
                var text = $('#'+id).text();
                resetSns(text);
            });
            return false;
        }else {
            $('#'+id + 'Error').hide();
            return true;
        }
    }

    //检查错误项
    function checkDevice(sns) {
        $.ajax({url: "/dev/deviceOp/checkDevice", data: {deviceSn: sns.toString(), opType: settings.opType, isForceIn: $('input[name="isForceIn"]').val()}, success: function(json){
            if(json.result != 1){
                $('#' + id + 'Error').html('，' + json.msg + ' <a href="javascript:" id="' + id + 'Remove"><i class="fa fa-trash-o"></i>移除错误项</a>');
                $('#'+id + 'Error').show();

                //鼠标移上去高亮显示对应的序列号
                $('#'+id + 'Error').unbind();
                $('#'+id + 'Error').hover(
                    function () {
                        $.each($('#'+id + ' span'), function(i, n){
                            $.each(json.data, function(i2, n2){
                                if($(n).attr('data-sn') == n2.sn) {
                                    $(n).removeClass('label-default');
                                    $(n).addClass('label-danger');
                                }
                            });
                        });
                    },
                    function () {
                        $('#'+id + ' span').removeClass('label-danger');
                        $('#'+id + ' span').addClass('label-default');
                    }
                );

                //点击移除项
                $('#'+id+'Remove').click(function () {
                    $.each($('#'+id + ' span'), function(i, n){
                        $.each(json.data, function(i2, n2){
                            if($(n).attr('data-sn') == n2.sn) {
                                $(n).remove();
                            }
                        });
                    });
                    var text = $('#'+id).text();
                    resetSns(text);
                });

                //租赁期间设备强制入库
                if(json.msg.indexOf('租赁使用期间')>=0) {
                    $('#' + id + 'IsForceIn').show();
                    $('#'+id+'IsForceInCB').unbind();
                    $('#'+id+'IsForceInCB').change(function () {
                        if($(this).prop("checked")){
                            $(this).val('true');
                        }else{
                            $(this).val('false');
                        }
                        var text = $('#'+id).text();
                        resetSns(text);
                    });
                }
            }else{
                $('#'+id + 'Error').hide();
            }
        }, type: "POST", dataType: "json", cache: false});
    }

    //移除操作
    function removeLink() {
        $('#'+id + ' a').click(function () {
            $(this).parent().remove();
            var html = $('#'+id).html();
            html = html.replace(",,", ",");
            $('#'+id).html(html);
            removeLink();

            //重新计算总数
            var deviceSnCount = 0;
            var text = $('#'+id).text();
            var deviceSns = text.split(',');
            var dsns = [];
            for (var i = 0; i < deviceSns.length; i++) {
                if(deviceSns[i].length>0) {
                    var sn = $.trim(deviceSns[i].replace('×', ''));
                    if(sn.length>0){
                        deviceSnCount++;
                        dsns.push(sn);
                    }
                }
            }
            $('#'+id + 'Count').text(deviceSnCount);
            $('#'+id + 'Value').val(dsns);

            checkDevice(dsns);

            //保持光标在最后
            keepLastIndex(document.getElementById(id));
        });
    }

    //两秒自动保存一次内容
    setInterval(function() {
        var sns = $('#'+id + 'Value').val();
        $.cookie(cookieName + settings.opType, sns, { path: '/', expires: 1 });
    }, 2000);

    //校验表单并提醒
    $("form").submit(function () {
        if($('#txtDeviceSnError').is(":hidden")){
            return true;
        }else{
            alert('数据有误，请检查！')
            return false;
        }
    });

    //悬浮出现工具栏
    $('#'+id + ', .deviceEditorTools').hover(
        function () {
            $('.deviceEditorTools').show();
        },
        function () {
            $('.deviceEditorTools').hide();
        }
    );

    //清空
    $('#btnDeviceClear').click(function () {
        $('#'+id).empty();
        resetSns('');
    });

    //排序
    $('#btnDeviceSort').click(function () {
        var text = $('#'+id).text();
        var deviceSns = text.split(',');
        resetSns(deviceSns.sort() + '');
    });

    /**
     * 获取设备数量
     */
    this.getCount = function () {
        return getRealCount($('#'+id + 'Value').val().split(','));
    }

    /**
     * 获取设备序列号数组
     * @returns {jQuery}
     */
    this.getSnArray = function () {
        return $('#'+id + 'Value').val().split(',');
    }
}

