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
import { DataConverter4mm } from "../../borep/DataConverters";
import { MaterialInventoryViewApp } from "./MaterialInventoryViewApp";

/** 列表应用-物料库存 */
export class MaterialInventoryListApp extends ibas.BOListApplication<IMaterialInventoryListView, bo.MaterialInventory> {

    /** 应用标识 */
    static APPLICATION_ID: string = "0c262355-6f2e-4450-8786-366303acfba8";
    /** 应用名称 */
    static APPLICATION_NAME: string = "materials_app_materialinventory_list";
    /** 业务对象编码 */
    static BUSINESS_OBJECT_CODE: string = bo.MaterialInventory.BUSINESS_OBJECT_CODE;
    /** 构造函数 */
    constructor() {
        super();
        this.id = MaterialInventoryListApp.APPLICATION_ID;
        this.name = MaterialInventoryListApp.APPLICATION_NAME;
        this.boCode = MaterialInventoryListApp.BUSINESS_OBJECT_CODE;
        this.description = ibas.i18n.prop(this.name);
    }
    /** 注册视图 */
    protected registerView(): void {
        super.registerView();
        // 其他事件
        this.view.editDataEvent = this.editData;
        this.view.deleteDataEvent = this.deleteData;
    }
    /** 视图显示后 */
    protected viewShowed(): void {
        // 视图加载完成
    }
    /** 查询数据 */
    protected fetchData(criteria: ibas.ICriteria): void {
        this.busy(true);
        let that: this = this;
        let boRepository: BORepositoryMaterials = new BORepositoryMaterials();
        boRepository.fetchMaterialInventory({
            criteria: criteria,
            onCompleted(opRslt: ibas.IOperationResult<bo.MaterialInventory>): void {
                try {
                    if (opRslt.resultCode !== 0) {
                        throw new Error(opRslt.message);
                    }
                    if (opRslt.resultObjects.length === 0) {
                        that.proceeding(ibas.emMessageType.INFORMATION, ibas.i18n.prop("shell_data_fetched_none"));
                    }
                    that.view.showData(opRslt.resultObjects);
                    that.busy(false);
                } catch (error) {
                    that.messages(error);
                }
            }
        });
        this.proceeding(ibas.emMessageType.INFORMATION, ibas.i18n.prop("shell_fetching_data"));
    }
    /** 新建数据 */
    protected newData(): void {
        // 不能编辑
    }
    /** 查看数据，参数：目标数据 */
    protected viewData(data: bo.MaterialInventory): void {
        // 检查目标数据
        if (ibas.objects.isNull(data)) {
            this.messages(ibas.emMessageType.WARNING, ibas.i18n.prop("shell_please_chooose_data",
                ibas.i18n.prop("shell_data_view")
            ));
            return;
        }
        let app: MaterialInventoryViewApp = new MaterialInventoryViewApp();
        app.navigation = this.navigation;
        app.viewShower = this.viewShower;
        app.run(data);

    }
    /** 编辑数据，参数：目标数据 */
    protected editData(data: bo.MaterialInventory): void {
        // 不能编辑
    }
    /** 删除数据，参数：目标数据集合 */
    protected deleteData(data: bo.MaterialInventory | bo.MaterialInventory[]): void {
        // 不能编辑
    }
    /** 获取服务的契约 */
    protected getServiceProxies(): ibas.IServiceProxy<ibas.IServiceContract>[] {
        return [
            new ibas.BOListServiceProxy({
                data: this.view.getSelecteds(),
                converter: new DataConverter4mm()
            })
        ];
    }
}
/** 视图-物料库存 */
export interface IMaterialInventoryListView extends ibas.IBOListView {
    /** 编辑数据事件，参数：编辑对象 */
    editDataEvent: Function;
    /** 删除数据事件，参数：删除对象集合 */
    deleteDataEvent: Function;
    /** 显示数据 */
    showData(datas: bo.MaterialInventory[]): void;
    /** 获取选择的数据 */
    getSelecteds(): bo.MaterialInventory[];
}
