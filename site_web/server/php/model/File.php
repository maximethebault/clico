<?php

class File extends ActiveRecord\Model
{
    public static $table_name = 'file';
    static $belongs_to = array(
        array('model3d'),
        array('specFile')
    );

    public function name() {
        return basename($this->path);
    }

    public function url() {
        return '../' . $this->path;
    }

    public function thumbnailUrl() {
        return '';
    }

    public function deleteUrl() {
        return 'server/php/libs/UploadHandler/?model3d_id=' . $this->model3d->id . '&spec_file_id=' . $this->specFile->id . '&file=' . $this->name();
    }

    public function deleteType() {
        return 'DELETE';
    }
}
