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

/** 编辑应用-物料价格清单 */
export class MaterialPriceListEditApp extends ibas.BOEditApplication<IMaterialPriceListEditView, bo.MaterialPriceList> {

    /** 应用标识 */
    static APPLICATION_ID: string = "7320a35f-de7d-4afa-8ccb-a1e1210d4e99";
    /** 应用名称 */
    static APPLICATION_NAME: string = "materials_app_materialpricelist_edit";
    /** 业务对象编码 */
    static BUSINESS_OBJECT_CODE: string = bo.MaterialPriceList.BUSINESS_OBJECT_CODE;
    /** 构造函数 */
    constructor() {
        super();
        this.id = MaterialPriceListEditApp.APPLICATION_ID;
        this.name = MaterialPriceListEditApp.APPLICATION_NAME;
        this.boCode = MaterialPriceListEditApp.BUSINESS_OBJECT_CODE;
        this.description = ibas.i18n.prop(this.name);
    }
    /** 注册视图 */
    protected registerView(): void {
        super.registerView();
        // 其他事件
        this.view.deleteDataEvent = this.deleteData;
        this.view.chooseBasedOnMaterialPriceListEvent = this.chooseBasedOnMaterialPriceList;
    }
    /** 视图显示后 */
    protected viewShowed(): void {
        // 视图加载完成
        if (ibas.objects.isNull(this.editData)) {
            // 创建编辑对象实例
            this.editData = new bo.MaterialPriceList();
            this.proceeding(ibas.emMessageType.WARNING, ibas.i18n.prop("shell_data_created_new"));
        }
        this.view.showMaterialPriceList(this.editData);
    }
    run(): void;
    run(data: bo.MaterialPriceList): void;
    run(): void {
        let that: this = this;
        if (ibas.objects.instanceOf(arguments[0], bo.MaterialPriceList)) {
            let data: bo.MaterialPriceList = arguments[0];
            // 新对象直接编辑
            if (data.isNew) {
                that.editData = data;
                that.show();
                return;
            }
            // 尝试重新查询编辑对象
            let criteria: ibas.ICriteria = data.criteria();
            if (!ibas.objects.isNull(criteria) && criteria.conditions.length > 0) {
                // 有效的查询对象查询
                criteria.noChilds = true;// 不加载子项
                let boRepository: BORepositoryMaterials = new BORepositoryMaterials();
                boRepository.fetchMaterialPriceList({
                    criteria: criteria,
                    onCompleted(opRslt: ibas.IOperationResult<bo.MaterialPriceList>): void {
                        let data: bo.MaterialPriceList;
                        if (opRslt.resultCode === 0) {
                            data = opRslt.resultObjects.firstOrDefault();
                        }
                        if (ibas.objects.instanceOf(data, bo.MaterialPriceList)) {
                            // 查询到了有效数据
                            that.editData = data;
                            that.show();
                        } else {
                            // 数据重新检索无效
                            that.messages({
                                type: ibas.emMessageType.WARNING,
                                message: ibas.i18n.prop("shell_data_deleted_and_created"),
                                onCompleted(): void {
                                    that.show();
                                }
                            });
                        }
                    }
                });
                return; // 退出
            }
        }
        super.run.apply(this, arguments);
    }
    /** 待编辑的数据 */
    protected editData: bo.MaterialPriceList;
    /** 保存数据 */
    protected saveData(): void {
        let that: this = this;
        let boRepository: BORepositoryMaterials = new BORepositoryMaterials();
        boRepository.saveMaterialPriceList({
            beSaved: this.editData,
            onCompleted(opRslt: ibas.IOperationResult<bo.MaterialPriceList>): void {
                try {
                    that.busy(false);
                    if (opRslt.resultCode !== 0) {
                        throw new Error(opRslt.message);
                    }
                    if (opRslt.resultObjects.length === 0) {
                        // 删除成功，释放当前对象
                        that.messages(ibas.emMessageType.SUCCESS,
                            ibas.i18n.prop("shell_data_delete") + ibas.i18n.prop("shell_sucessful"));
                        that.editData = undefined;
                    } else {
                        // 替换编辑对象
                        that.editData = opRslt.resultObjects.firstOrDefault();
                        that.messages(ibas.emMessageType.SUCCESS,
                            ibas.i18n.prop("shell_data_save") + ibas.i18n.prop("shell_sucessful"));
                    }
                    // 刷新当前视图
                    that.viewShowed();
                } catch (error) {
                    that.messages(error);
                }
            }
        });
        this.busy(true);
        this.proceeding(ibas.emMessageType.INFORMATION, ibas.i18n.prop("shell_saving_data"));
    }
    /** 删除数据 */
    protected deleteData(): void {
        let that: this = this;
        this.messages({
            type: ibas.emMessageType.QUESTION,
            title: ibas.i18n.prop(this.name),
            message: ibas.i18n.prop("sys_whether_to_delete"),
            actions: [ibas.emMessageAction.YES, ibas.emMessageAction.NO],
            onCompleted(action: ibas.emMessageAction): void {
                if (action === ibas.emMessageAction.YES) {
                    that.editData.delete();
                    that.saveData();
                }
            }
        });
    }
    /** 选择基于的价格清单 */
    chooseBasedOnMaterialPriceList(): void {
        let that: this = this;
        ibas.servicesManager.runChooseService<bo.MaterialPriceList>({
            boCode: bo.MaterialPriceList.BUSINESS_OBJECT_CODE,
            chooseType: ibas.emChooseType.SINGLE,
            criteria: [
                new ibas.Condition(
                    bo.MaterialPriceList.PROPERTY_OBJECTKEY_NAME, ibas.emConditionOperation.NOT_EQUAL, this.editData.objectKey)
            ],
            onCompleted(selecteds: ibas.List<bo.MaterialPriceList>): void {
                that.editData.basedOnList = selecteds.firstOrDefault().objectKey;
                that.editData.factor = 1;
            }
        });
    }

}
/** 视图-物料价格清单 */
export interface IMaterialPriceListEditView extends ibas.IBOEditView {
    /** 显示数据 */
    showMaterialPriceList(data: bo.MaterialPriceList): void;
    /** 删除数据事件 */
    deleteDataEvent: Function;
    /** 选择基于的价格清单 */
    chooseBasedOnMaterialPriceListEvent: Function;
}
