var overtimeTypes = ['工作日加班', '双休日加班', '法定节假日加班', '其他'];

//url链接中带有check=true参数，则显示审核选项卡
if(getUrlParam('check')) {
    //显示审核部分
    $('.tab-link').removeClass('active');
    $('.tab').removeClass('active');
    $('#tab3').addClass('active');
    $('#tab-check-overtime').addClass('active');
}

if(isBoss) {
    //显示审核选项卡
    $('#tab3').css('display', '');
    $('#tab-check-overtime').css('display', '');
}else{
    //隐藏审核选项卡
    $('#tab3').css('display', 'none');
    $('#tab-check-overtime').css('display', 'none');
}

//是否带薪的CheckBox处理
$("#salary-checkbox").change(function() {
    var checked = $(this).attr('checked');
    var hintLabel = $(".label_checkbox-hint");
    if(checked) {
        hintLabel.text("带薪");
    }else{
        hintLabel.text("不带薪");
    }
})

//加载加班申请列表
function loadList() {
    $.ajax({
        type: 'GET',
        url: requestBaseUrl + 'companies/users/overtime',
        headers: {
            'Authorization': 'Bearer ' + getToken()
        },
        success: function(response) {
            if (response.status == 10001) {
                showList(response);
            } else {
                $.toast('错误' + response.status);
            }
        },
        error: function(jqXHR, textStatus, errorThrown) {
             $.toast('加载加班记录出错' + jqXHR.status);
        }
    });
}

//显示加班申请列表
function showList(response) {
    var dataList = response.data.list;
    if(dataList == null || dataList.length == 0) {
        $('#tab-page-list').html('<div class="hint">暂无历史加班记录</div>');
        return ;
    }
    var str = '<div class="list-block media-list"><ul>';
    var data = {
        list: dataList
    };
    template.helper('getTimeStr', getTimeStr);
    str += template('overtime-list-template', data);
    str += "</ul></div>";
    $('#tab-page-list').html(str);
    $('li.list-item').click(function() {
        var type = $(this).find('#type').text();
        var title = $(this).find('#title').text();
        var reason = $(this).find('#reason').text();
        var time = $(this).find('#time').text();
        var result = $(this).find('#result').text();
        var content = title + '<br/>' + reason + '<br/>' + time + '<br>' + result;
        $.alert(content, '加班详情');
        $('.modal').css('text-align', 'left'); //让对话框中的文本左对齐
    });
}

//加载加班审核列表
function loadCheckOvertimeList() {
    $.ajax({
        type: 'GET',
        url: requestBaseUrl + 'companies/users/overtime/check',
        headers: {
            'Authorization': 'Bearer ' + getToken()
        },
        success: function(response) {
            if(response.status == 10001) {
                var list = response.data.list;
                if(list.length > 0) {
                    showCheckOvertimeList(list);
                }else{
                    showNoCheckOvertimeHint();
                }
            }
        },
        error: function() {
            showNoCheckOvertimeHint();
        }
    })
}

//显示加班审核列表
function showCheckOvertimeList(list) {
    var data = {
        list: list
    };
    template.helper('getTimeStr', getTimeStr);
    $('#tab-page-check-content').html(template('overtime-check-list-template', data));
    
    //同意按钮的点击处理
    $('[class="link agree"]').click(function() {
        showAgreeOrNotDialog($(this).attr('id'), true, list);
        // $.toast('agree id = ' + $(this).attr('id'));
    });
    //不同意按钮的点击处理
    $('[class="link disagree"]').click(function() {
        showAgreeOrNotDialog($(this).attr('id'), false, list);
        // $.toast('disagree id = ' + $(this).attr('id'));
    });
}

//显示同意或拒绝对话框
function showAgreeOrNotDialog(id, isAgree, list) {
    var msg = '';
    if(isAgree) {
        msg = '确定要同意该加班申请吗？';
    }else{
        msg = '确定要拒绝该加班申请吗？';
    }
    $.confirm(msg, '提示', function() {
        //确定同意或拒绝
        operateAgreeOrNot(id, isAgree, list);
    });
}

//操作某条申请，同意或者拒绝
function operateAgreeOrNot(id, isAgree, list) {
    var url = requestBaseUrl + 'companies/users/overtime/' + id;
    var type = 'PUT';
    if(!isAgree) {
        //拒绝加班申请，请求的method为delete，同意的method为put
        type = "DELETE";
    }
    $.ajax({
        url: url,
        type: type,
        headers: {
            'Authorization': 'Bearer ' + getToken()
        },
        success: function(response) {
            if(response.status == 10001) {
                $.toast('操作成功');
                //删除当前列表中的操作项
                $('div#card-id-' + id).remove();
                if(list.length == 1) {
                    showNoCheckOvertimeHint();
                }
            }else{
                $.toast('操作失败，错误码：' + response.status);
            }
        },
        error: function(jqXHR, textStatus, errorThrown) {
            $.toast('操作失败' + jqXHR.status);
        }
    })
}

//显示无待审核加班申请提示信息
function showNoCheckOvertimeHint() {
    $('#tab-page-check-content').html('<div class="hint">暂无待审核的加班申请</div>');
}

$("#select-type").picker({
    toolbarTemplate: '<header class="bar bar-nav">\
      <button class="button button-link pull-right close-picker">确定</button>\
      <h1 class="title">选择请假类型</h1>\
      </header>',
    cols: [{
        textAlign: 'center',
        values: overtimeTypes
    }]
});

var timeNow = getTimeNow(); //common.js中的方法
$('input.date-picker').datetimePicker({
    value: [timeNow.yearStr, timeNow.monthStr, 
        timeNow.dayStr, timeNow.hourStr, timeNow.minuteStr]
});

//点击清空按钮，清空表单内容
$('#btn-clear').click(function() {
    $.confirm('确定要清空填写的内容吗？', '提示', function() {
        clearForm();
    });
})

//点击提交按钮，提交表单数据
$('#btn-submit').click(function() {
    var typeName = $('#select-type').val();
    var title = $('#overtime-title').val();
    var reason = $('#overtime-reason').val();
    var startTime = $('#start-time-picker').val();
    var endTime = $('#end-time-picker').val();
    var hours = $('#hours').val();
    var isChecked = $("#salary-checkbox").attr('checked');
    var have_salary;
    if(isChecked) {
        have_salary = 1;
    }else{
        have_salary = 2;
    }
    if (isEmpty(typeName)) {
        $.toast('请选择加班类型');
        return ;
    }
    if (isEmpty(title)) {
        $.toast('请填写加班标题' + title);
        return ;
    }
    if (isEmpty(reason)) {
        $.toast('请填写加班原因');
        return ;
    }
    if (isEmpty(startTime) || isEmpty(endTime)) {
        $.toast('请选择加班时间');
        return ;
    }
    if (compareDateStr(startTime + ':00', endTime + ':00') != -1) {
        $.toast('开始时间必须在结束时间之前');
        return ;
    }
    if(isEmpty(hours)) {
        $.toast('请填写加班小时');
        return ;
    }
    if(!isNumber(hours) || hours <= 0) {
        $.toast('加班小时数填写有误');
        return ;
    }
    startTime = startTime.replace(/-/g,"/");
    endTime = endTime.replace(/-/g,"/");
    //要发给上级的聊天消息数据
    var msg = '加班申请单\n类型：' + typeName + '\n原因：'
                + reason + '\n开始时间：' + startTime
                + '\n结束时间：' + endTime;
    submitOvertimeApply(title, reason, startTime, endTime, hours, have_salary, msg);
})

//清空表单
function clearForm() {
    $('#select-type').val('');
    $('#overtime-title').val('');
    $('#overtime-reason').val('');
    // $('#start-time-picker').val('');
    // $('#end-time-picker').val('');
    $('#hours').val('');
}

//加载加班申请列表
loadList();

//加载加班审核列表
loadCheckOvertimeList();

//加载我的上级信息
getMyLeader();
