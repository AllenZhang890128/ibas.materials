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

    /** 服务输入数据 */
    protected inputData: bo.MaterialBatchInput[];

    /** 注册视图 */
    protected registerView(): void {
        super.registerView();
        // 其他事件
        this.view.addBatchEvent = this.addBatch;
        this.view.removeBatchEvent = this.removeBatch;
        this.view.autoCreateBatchEvent = this.autoCreateBatch;
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
        item.materialBatchInputBatchJournals.create();
        // 仅显示没有标记删除的
        this.view.showData(item.materialBatchInputBatchJournals.filterDeleted());
    }

    protected removeBatch(batch: bo.MaterialBatchInput,items: bo.MaterialBatchJournal[]): void {

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
        this.view.showData(batchData.materialBatchInputBatchJournals);
    }

    protected autoCreateBatch(item: bo.MaterialBatchInput): void {
        let batchLine: bo.MaterialBatchJournal = item.materialBatchInputBatchJournals.create();
        let allcationQuantity: number = 0;
        // 如果该凭证已经开始创建批次
        if (item.materialBatchInputBatchJournals.length !== 0) {
            for (let batch of item.materialBatchInputBatchJournals) {
                allcationQuantity = allcationQuantity + batch.quantity;
            }
            batchLine.quantity = item.needQuantity - allcationQuantity;
        } else {
            batchLine.quantity = item.needQuantity;
        }
        // this.editData
        this.view.showData(item.materialBatchInputBatchJournals);
    }
    /** 运行,覆盖原方法 */
    run(...args: any[]): void {
        let that: this = this;
        // if (ibas.objects.instanceOf(arguments[0].caller.firstOrDefault, bo.MaterialBatchInput)) {
        if (arguments[0].caller.length >= 1) {
            that.inputData = arguments[0].caller;
        }
        super.run();
    }
    /** 视图显示后 */
    protected viewShowed(): void {
        // 视图加载完成
        this.view.showJournalLineData(this.inputData);
    }
    protected newData(): void {
        throw new Error("Method not implemented.");
    }
    protected fetchData(criteria: ibas.ICriteria): void {
        throw new Error("Method not implemented.");
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