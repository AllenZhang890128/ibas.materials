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

export class MaterialBatchIssueApp extends ibas.BOApplication<IMaterialBatchIssueView> {

    /** 应用标识 */
    static APPLICATION_ID: string = "141e2a0f-3120-40a3-9bb4-f8b61672ed9c";
    /** 应用名称 */
    static APPLICATION_NAME: string = "materials_app_materialbatchissue";
    /** 业务对象编码 */
    static BUSINESS_OBJECT_CODE: string = bo.MaterialBatchJournal.BUSINESS_OBJECT_ISSUE_CODE;
    /** 构造函数 */
    constructor() {
        super();
        this.id = MaterialBatchIssueApp.APPLICATION_ID;
        this.name = MaterialBatchIssueApp.APPLICATION_NAME;
        this.boCode = MaterialBatchIssueApp.BUSINESS_OBJECT_CODE;
        this.description = ibas.i18n.prop(this.name);
    }
    /** 完成 */
    private onCompleted: Function;
    /** 服务输入输出数据 */
    protected inputData: bo.MaterialBatchInput[];
    /** 可选批次信息 */
    protected batchData: bo.MaterialBatch[];

    /** 注册视图 */
    protected registerView(): void {
        super.registerView();
        // 其他事件
        this.view.selectMaterialBatchJournalLineEvent = this.selectMaterialBatchJournalLine;
        this.view.autoSelectMaterialBatchEvent = this.autoSelectMaterialBatch;
        this.view.addBatchMaterialBatchEvent = this.addBatchMaterialBatch;
        this.view.removeBatchMaterialBatchEvent = this.removeBatchMaterialBatch;
        this.view.saveDataEvent = this.saveData;
    }
    /** 视图显示后 */
    protected viewShowed(): void {
        // 视图加载完成
        this.view.showJournalLineData(this.inputData);
    }
    protected newData(): void {
        throw new Error("Method not implemented.");
    }
    /** 选择凭证行事件 -更新可用批次 */
    protected selectMaterialBatchJournalLine(selected: bo.MaterialBatchInput): void {
        let that: this = this;
        // 根据物料查询可用批次
        let criteria: ibas.ICriteria = new ibas.Criteria();
        let condition: ibas.ICondition = criteria.conditions.create();
        condition = new ibas.Condition(bo.MaterialBatch.PROPERTY_ITEMCODE_NAME, ibas.emConditionOperation.EQUAL, selected.itemCode);
        condition = criteria.conditions.create();
        condition = new ibas.Condition(bo.MaterialBatch.PROPERTY_WAREHOUSE_NAME, ibas.emConditionOperation.EQUAL, selected.warehouse);
        condition.relationship = ibas.emConditionRelationship.AND;
        that.fetchBatchData(criteria, selected);
    }
    protected autoSelectMaterialBatch(selected: bo.MaterialBatchInput): void {
        // 未选择凭证行
        if (ibas.objects.isNull(selected)) {
            this.messages(ibas.emMessageType.WARNING, ibas.i18n.prop("sys_shell_please_chooose_data",
                ibas.i18n.prop("materials_app_batch_serial_choose_journal")
            ));
            return;
        }
        let batchItem: bo.MaterialBatchInput = this.inputData.find(c => c.index === selected.index);
        // 不需要选择批次了
        if (batchItem.needQuantity === 0) {
            this.view.showRightData(batchItem.materialBatchInputBatchJournals.filterDeleted());
            return;
        }
        // 无批次可用
        if (ibas.objects.isNull(this.batchData)) {
            // 查询可用批次信息
            let criteria: ibas.ICriteria = new ibas.Criteria();
            let condition: ibas.ICondition = criteria.conditions.create();
            condition = new ibas.Condition(bo.MaterialBatch.PROPERTY_ITEMCODE_NAME, ibas.emConditionOperation.EQUAL, selected.itemCode);
            condition = criteria.conditions.create();
            condition = new ibas.Condition(bo.MaterialBatch.PROPERTY_WAREHOUSE_NAME, ibas.emConditionOperation.EQUAL, selected.warehouse);
            condition.relationship = ibas.emConditionRelationship.AND;
            this.fetchBatchData(criteria, selected);
            return;
        }
        this.allocateBatch(selected, "");
        let line: bo.MaterialBatchInput = this.inputData.find(c => c.index === selected.index);
        this.view.showLeftData(this.batchData.filter(c => c.isDeleted === false));
        this.view.showRightData(line.materialBatchInputBatchJournals.filterDeleted());
        /** 按照一定规则自动选择批次信息 */
        // 获取规则
        // 假设按照创建时间顺序自动选择

    }
    protected allocateBatch(journal: bo.MaterialBatchInput, rule: string): void {
        // 按照一定规则排序
        this.batchData.sort();
        let newBatchData: bo.MaterialBatch[] = new Array<bo.MaterialBatch>();
        let line: bo.MaterialBatchInput = this.inputData.find(c => c.index === journal.index);
        for (let item of this.batchData) {
            // 已分配数量
            if (line.needQuantity === 0) {
                return;
            }
            let batchLine: bo.MaterialBatchJournal = line.materialBatchInputBatchJournals.create();
            batchLine.itemCode = item.itemCode;
            batchLine.warehouse = item.warehouse;
            batchLine.batchCode = item.batchCode;
            if (item.quantity <= line.needQuantity) {
                batchLine.quantity = item.quantity;
                item.delete();
            } else {
                batchLine.quantity = line.needQuantity;
                item.quantity -= batchLine.quantity;
                newBatchData.push(item);
            }

        }
    }
    /** 添加选择的批次事件 */
    protected addBatchMaterialBatch(selected: bo.MaterialBatchInput, items: bo.MaterialBatch[]): void {
        // 未选择凭证行
        if (ibas.objects.isNull(selected)) {
            this.messages(ibas.emMessageType.WARNING, ibas.i18n.prop("sys_shell_please_chooose_data",
                ibas.i18n.prop("materials_app_batch_serial_choose_journal")
            ));
            return;
        }
        let journalItem: bo.MaterialBatchInput = this.inputData.find(c => c.index === selected.index);
        let allocateQuantity: number = 0;
        for (let item of items) {
            // 不需要选择批次了
            if (journalItem.needQuantity === 0) {
                this.view.showRightData(journalItem.materialBatchInputBatchJournals.filterDeleted());
                return;
            }
            // let batchItem:bo.MaterialBatch = this.batchData.find(c=>c.batchCode === item.batchCode);
            let line: bo.MaterialBatchJournal = journalItem.materialBatchInputBatchJournals.create();
            line.batchCode = item.batchCode;
            line.itemCode = item.itemCode;
            line.warehouse = item.warehouse;
            if (item.quantity <= journalItem.needQuantity) {
                line.quantity = item.quantity;
                item.delete();
            } else {
                line.quantity = journalItem.needQuantity;
                item.quantity -= line.quantity;
            }
        }
        this.view.showLeftData(this.batchData.filter(c => c.isDeleted === false));
        this.view.showRightData(journalItem.materialBatchInputBatchJournals);
    }
    /** 移除选择的批次事件 */
    protected removeBatchMaterialBatch(selected: bo.MaterialBatchInput, items: bo.MaterialBatchJournal[]): void {
        // 未选择凭证行
        if (ibas.objects.isNull(selected)) {
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
        let line: bo.MaterialBatchInput = this.inputData.find(c => c.index === selected.index);
        // 移除项目
        for (let item of items) {
            if (line.materialBatchInputBatchJournals.indexOf(item) >= 0) {
                if (item.isNew) {
                    // 新建的移除集合
                    line.materialBatchInputBatchJournals.remove(item);
                } else {
                    // 非新建标记删除
                    item.delete();
                }
                let batchItem: bo.MaterialBatch = this.batchData.find(c => c.batchCode === item.batchCode && c.isDeleted === false);
                if (!ibas.objects.isNull(batchItem)) {
                    batchItem.quantity += item.quantity;
                } else {
                    batchItem = new bo.MaterialBatch();
                    batchItem.batchCode = item.batchCode;
                    batchItem.itemCode = item.itemCode;
                    batchItem.warehouse = item.warehouse;
                    batchItem.quantity = item.quantity;
                    this.batchData.push(batchItem);
                }
            }
        }
        this.view.showLeftData(this.batchData.filter(c => c.isDeleted === false));
        this.view.showRightData(line.materialBatchInputBatchJournals.filterDeleted());
    }
    /** 查询数据 */
    protected fetchBatchData(criteria: ibas.ICriteria, selected: bo.MaterialBatchInput): void {
        this.busy(true);
        let that: this = this;
        let boRepository: BORepositoryMaterials = new BORepositoryMaterials();
        boRepository.fetchMaterialBatch({
            criteria: criteria,
            onCompleted(opRslt: ibas.IOperationResult<bo.MaterialBatch>): void {
                try {
                    if (opRslt.resultCode !== 0) {
                        throw new Error(opRslt.message);
                    }
                    that.filterSelected(opRslt.resultObjects, selected);
                    that.view.showLeftData(that.batchData);
                    that.busy(false);
                    // that.batchData = ;
                } catch (error) {
                    that.messages(error);
                }
            }
        });
        this.proceeding(ibas.emMessageType.INFORMATION, ibas.i18n.prop("sys_shell_fetching_data"));
    }

    protected filterSelected(fetchData: bo.MaterialBatch[], selected: bo.MaterialBatchInput): bo.MaterialBatch[] {
        if (ibas.objects.isNull(selected) || selected.materialBatchInputBatchJournals.length === 0) {
            this.batchData = fetchData;
            return fetchData;
        }
        for (let item of selected.materialBatchInputBatchJournals) {
            let batchItem: bo.MaterialBatch = fetchData.find(c => c.batchCode === item.batchCode);
            if (ibas.objects.isNull(batchItem)) {
                // 移除已选择的批次  因为不存在
                item.delete();
            } else {
                if (batchItem.quantity === item.quantity) {
                    batchItem.delete();
                } else {
                    batchItem.quantity = Number(batchItem.quantity) - Number(item.quantity);
                }
            }
        }
        this.batchData = fetchData.filter(c => c.isDeleted === false);

    }
    /** 运行,覆盖原方法 */
    run(...args: any[]): void {
        let that: this = this;
        // if (ibas.objects.instanceOf(arguments[0].caller.firstOrDefault, bo.MaterialBatchInput)) {
        if (arguments[0].caller.length >= 1) {
            // 需要加判断条件，过滤掉非批次管理的物料
            that.inputData = arguments[0].caller;
        }
        this.onCompleted = arguments[0].onCompleted;
        super.run();
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

/** 视图-批次新建 */
export interface IMaterialBatchIssueView extends ibas.IBOView {
    /** 显示数据 */
    showLeftData(datas: bo.MaterialBatch[]): void;
    showRightData(datas: bo.MaterialBatchJournal[]): void;
    showJournalLineData(datas: bo.MaterialBatchInput[]): void;
    /** 选择设置批次中凭证行信息事件 */
    selectMaterialBatchJournalLineEvent: Function;
    /** 自动选择事件 */
    autoSelectMaterialBatchEvent: Function;
    /** 添加选择的批次事件 */
    addBatchMaterialBatchEvent: Function;
    /** 移除选择的批次事件 */
    removeBatchMaterialBatchEvent: Function;
    /** 返回数据 */
    saveDataEvent: Function;
}

/** 批次选择服务映射 */
export class MaterialBatchIssueServiceMapping extends ibas.ServiceMapping {
    /** 构造函数 */
    constructor() {
        super();
        this.id = MaterialBatchIssueApp.APPLICATION_ID;
        this.name = MaterialBatchIssueApp.APPLICATION_NAME;
        this.category = MaterialBatchIssueApp.BUSINESS_OBJECT_CODE;
        this.description = ibas.i18n.prop(this.name);
        this.proxy = ibas.BOChooseServiceProxy;
    }
    /** 创建服务并运行 */
    create(): ibas.IService<ibas.IBOChooseServiceContract> {
        return new MaterialBatchIssueApp();
    }
}