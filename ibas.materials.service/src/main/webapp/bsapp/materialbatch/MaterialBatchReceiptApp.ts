/**
 * @license
 * Copyright color-coding studio. All Rights Reserved.
 *
 * Use of this source code is governed by an Apache License, Version 2.0
 * that can be found in the LICENSE file at http://www.apache.org/licenses/LICENSE-2.0
 */
import * as ibas from "ibas/index";
import * as bo from "../../borep/bo/index";
import { BORepositoryMaterials } from "../../borep/BORepositories";

export class MaterialBatchReceiptApp extends ibas.BOApplication<IMaterialBatchReceiptView> {
    /** 应用标识 */
    static APPLICATION_ID: string = "f4448871-b03a-48f5-bf6d-9418259fab9d";
    /** 应用名称 */
    static APPLICATION_NAME: string = "materials_app_materialbatchreceipt";
    /** 业务对象编码 */
    static BUSINESS_OBJECT_CODE: string = bo.MaterialBatchJournal.BUSINESS_OBJECT_RECEIEPT_CODE;
    /** 构造函数 */
    constructor() {
        super();
        this.id = MaterialBatchReceiptApp.APPLICATION_ID;
        this.name = MaterialBatchReceiptApp.APPLICATION_NAME;
        this.boCode = MaterialBatchReceiptApp.BUSINESS_OBJECT_CODE;
        this.description = ibas.i18n.prop(this.name);
    }
    /** 完成 */
    private onCompleted: Function;
    /** 服务输入数据 */
    protected inputData: bo.MaterialBatchInput[];

    /** 注册视图 */
    protected registerView(): void {
        super.registerView();
        // 其他事件
        this.view.addBatchEvent = this.addBatch;
        this.view.removeBatchEvent = this.removeBatch;
        this.view.autoCreateBatchEvent = this.autoCreateBatch;
        this.view.saveDataEvent = this.saveData;
    }
    protected addBatch(select: bo.MaterialBatchInput): void {
        // 确认选择了凭证信息
        if (ibas.objects.isNull(select)) {
            this.messages(ibas.emMessageType.WARNING, ibas.i18n.prop("sys_shell_please_chooose_data",
                ibas.i18n.prop("materials_app_batch_serial_choose_journal")
            ));
            return;
        }
        // 找到输入数据的批次集合
        let item: bo.MaterialBatchInput = this.inputData.find(c => c.index === select.index);
        if (item.needBatchQuantity === 0) {
            return;
        }
        item.materialBatchInputBatchJournals.create();
        // 仅显示没有标记删除的
        this.view.showData(item.materialBatchInputBatchJournals.filterDeleted());
    }

    protected removeBatch(batch: bo.MaterialBatchInput, items: bo.MaterialBatchJournal[]): void {
        // 未选择凭证行
        if (ibas.objects.isNull(batch)) {
            this.messages(ibas.emMessageType.WARNING, ibas.i18n.prop("sys_shell_please_chooose_data",
                ibas.i18n.prop("materials_app_batch_serial_choose_journal")
            ));
            return;
        }
        // 非数组，转为数组
        if (!(items instanceof Array)) {
            items = [items];
        }
        if (items.length === 0) {
            return;
        }
        // 找到输入数据的批次集合
        let batchData: bo.MaterialBatchInput = this.inputData.find(c => c.index === batch.index);
        // 移除项目
        for (let item of items) {
            if (batchData.materialBatchInputBatchJournals.indexOf(item) >= 0) {
                if (item.isNew) {
                    // 新建的移除集合
                    batchData.materialBatchInputBatchJournals.remove(item);
                } else {
                    // 非新建标记删除
                    item.delete();
                }
            }
        }
        // 仅显示没有标记删除的
        this.view.showData(batchData.materialBatchInputBatchJournals.filterDeleted());
    }

    protected autoCreateBatch(item: bo.MaterialBatchInput): void {
        // 未选择凭证行
        if (ibas.objects.isNull(item)) {
            this.messages(ibas.emMessageType.WARNING, ibas.i18n.prop("sys_shell_please_chooose_data",
                ibas.i18n.prop("materials_app_batch_serial_choose_journal")
            ));
            return;
        }
        let batchItem: bo.MaterialBatchInput = this.inputData.find(c => c.index === item.index);
        // 不需要创建批次了
        if (batchItem.needBatchQuantity === 0) {
            this.view.showData(batchItem.materialBatchInputBatchJournals.filterDeleted());
            return;
        }
        let batchLine: bo.MaterialBatchJournal;
        let allcationQuantity: number = Number(0);
        // 如果该凭证已经开始创建批次
        if (batchItem.materialBatchInputBatchJournals.length !== 0) {
            for (let batch of batchItem.materialBatchInputBatchJournals.filterDeleted()) {
                allcationQuantity = Number(allcationQuantity) + Number(batch.quantity);
                // 过滤掉为0的
                if (batch.quantity === 0) {
                    batch.delete();
                }
            }
            batchLine = batchItem.materialBatchInputBatchJournals.create();
            batchLine.quantity = batchItem.quantity - Number(allcationQuantity);
        } else {
            batchLine = batchItem.materialBatchInputBatchJournals.create();
            batchLine.quantity = batchItem.needBatchQuantity;
        }
        this.view.showData(batchItem.materialBatchInputBatchJournals.filterDeleted());
    }
    /** 运行,覆盖原方法 */
    run(...args: any[]): void {
        let that: this = this;
        // if (ibas.objects.instanceOf(arguments[0].caller.firstOrDefault, bo.MaterialBatchInput)) {
        if (arguments[0].caller.length >= 1) {
            that.inputData = arguments[0].caller;
        }
        this.onCompleted = arguments[0].onCompleted;
        super.run();
    }
    /** 视图显示后 */
    protected viewShowed(): void {
        // 视图加载完成
        this.view.showJournalLineData(this.inputData);
    }

    protected saveData(): void {
        this.fireCompleted(this.inputData);
    }
    /** 触发完成事件 */
    private fireCompleted(selecteds: bo.MaterialBatchInput[] | bo.MaterialBatchInput): void {
        // 关闭视图
        this.close();
        if (ibas.objects.isNull(this.onCompleted)) {
            return;
        }
        // 转换返回类型
        let list: ibas.ArrayList<bo.MaterialBatchInput> = new ibas.ArrayList<bo.MaterialBatchInput>();
        if (selecteds instanceof Array) {
            // 当是数组时
            for (let item of selecteds) {
                list.add(item);
            }
        } else {
            // 非数组,认为是单对象
            list.add(selecteds);
        }
        if (list.length === 0) {
            // 没有数据不触发事件
            return;
        }
        try {
            // 调用完成事件
            this.onCompleted.call(this.onCompleted, list);
        } catch (error) {
            // 完成事件出错
            this.messages(error);
        }
    }
}


/** 视图-新建批次 */
export interface IMaterialBatchReceiptView extends ibas.IBOView {
    /** 显示数据 */
    showData(datas: bo.MaterialBatchJournal[]): void;
    showJournalLineData(datas: bo.MaterialBatchInput[]): void;
    /** 添加批次事件 */
    addBatchEvent: Function;
    /** 移除批次事件 */
    removeBatchEvent: Function;
    /** 自动创建批次事件 */
    autoCreateBatchEvent: Function;
    /** 返回数据 */
    saveDataEvent: Function;
}

/** 新建批次服务映射 */
export class MaterialBatchReceipServiceMapping extends ibas.ServiceMapping {
    /** 构造函数 */
    constructor() {
        super();
        this.id = MaterialBatchReceiptApp.APPLICATION_ID;
        this.name = MaterialBatchReceiptApp.APPLICATION_NAME;
        this.category = MaterialBatchReceiptApp.BUSINESS_OBJECT_CODE;
        this.description = ibas.i18n.prop(this.name);
        this.proxy = ibas.BOChooseServiceProxy;
    }
    /** 创建服务并运行 */
    create(): ibas.IService<ibas.IBOChooseServiceContract> {
        return new MaterialBatchReceiptApp();
    }
}