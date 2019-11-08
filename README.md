# deviceEditor
一款设备序列号录入编辑器，回车能自动加分隔符，适合扫码枪录入，也可以手工录入，能自动校验重复去重，检查错误，统计总数、排序、清空等，效果如下：
 ![image](https://github.com/JasonheSZ/deviceEditor/raw/master/deviceImg.jpg)
###用法：
```javascript
//初始化设备编辑器
var dEditor = new deviceEditor('txtDeviceSn', {
    opType: 'rentToUser'
});

.....

//重置设备编辑器内容
dEditor.resetText();
//获取序列号数量
dEditor.getCount();
//获取序列号数组
dEditor.getSnArray();
```
